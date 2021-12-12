use headless_chrome::{Browser, LaunchOptionsBuilder, protocol::page::ScreenshotFormat, Tab};
use std::{fs, collections::BTreeSet, sync::Arc, sync::atomic::{AtomicUsize, Ordering}, time::Duration, thread};
use std::io::{Cursor, Write};
use image::{io::Reader, imageops::FilterType, ImageFormat, jpeg::JpegEncoder, GenericImageView};
use crossbeam_queue::ArrayQueue;

const CAPTURE_WIDTH: u32 = 1050;
const CAPTURE_HEIGHT: u32 = 1050;

const OUTPUT_WIDTH: u32 = 350;
const OUTPUT_HEIGHT: u32 = 350;

const OUTPUT_DIRECTORY: &str = "../../public_s3/card_images";
const JPEG_QUALITY: Option<u8> = Some(75); // Or output a lossless PNG if None.

const MENU_BAR_HEIGHT: u32 = 124;
const NUM_THREADS: u32 = 4;

fn main() {
    fs::create_dir_all(OUTPUT_DIRECTORY).unwrap();
    let extension = if JPEG_QUALITY.is_some() { ".jpeg" } else { ".png" };

    let expected_token_ids = token_ids_from_metadata_directory();
    let actual_token_ids = token_ids_from_output_directory(extension);

    let missing_token_ids = expected_token_ids.difference(&actual_token_ids).collect::<Vec<_>>();
    let surplus_token_ids = actual_token_ids.difference(&expected_token_ids).collect::<Vec<_>>();

    if missing_token_ids.is_empty() { println!("All images already captured. Exiting."); return; }

    let queue = Arc::new(ArrayQueue::new(missing_token_ids.len()));
    missing_token_ids.iter().for_each(|t| queue.push(t.to_string()).unwrap());

    surplus_token_ids.iter().for_each(|t| fs::remove_file(format!("{}/{}{}", OUTPUT_DIRECTORY, t, extension)).unwrap());
    if !surplus_token_ids.is_empty() { println!("\nRemoved {} images that have no corresponding metadata.", surplus_token_ids.len()); }

    println!("\nCapturing at {}x{} then resizing to {}x{}.", CAPTURE_WIDTH, CAPTURE_HEIGHT, OUTPUT_WIDTH, OUTPUT_HEIGHT);
    println!("\n{}/{} images already captured.\n", expected_token_ids.len() - missing_token_ids.len(), expected_token_ids.len());

    let num_captured = Arc::new(AtomicUsize::new(0));
    let num_total = missing_token_ids.len();

    let mut threads = (0..NUM_THREADS).map(|i| {
        let queue = Arc::clone(&queue);
        let num_captured = Arc::clone(&num_captured);

        thread::spawn(move || {
            let (mut chrome, mut tab) = new_instance_of_chrome_with_one_tab();

            let mut next_token_id = queue.pop();
            let mut preloaded = false;

            loop {
                let token_id = match next_token_id { Some(t) => t, _ => break };
                next_token_id = queue.pop();

                loop {
                    let (success, preloaded_next) = capture_screenshot_of_card_page(&tab, &token_id, &extension, preloaded, &next_token_id);
                    preloaded = preloaded_next;

                    if success {
                        break;
                    } else {
                        println!("Chrome instance {} is stuck, restarting...", i);

                        drop(tab); drop(chrome);
                        let (a, b) = new_instance_of_chrome_with_one_tab();
                        chrome = a; tab = b;
                    }
                }

                let previous = num_captured.fetch_add(1, Ordering::Relaxed);
                println!("Captured {}/{}", previous + 1, num_total);
            }
        })
    }).collect::<Vec<_>>();

    for thread in threads.drain(..) {
        thread.join().unwrap();
    }
}

fn new_instance_of_chrome_with_one_tab() -> (Browser, Arc<Tab>) {
    let options = LaunchOptionsBuilder::default()
        .headless(false) // Otherwise, it tends to time out.
        .window_size(Some((CAPTURE_WIDTH / 2, CAPTURE_HEIGHT / 2 + MENU_BAR_HEIGHT)))
        .idle_browser_timeout(Duration::from_secs(999999999))
        .build().unwrap();

    let chrome = Browser::new(options).unwrap();
    let tab = chrome.wait_for_initial_tab().unwrap();

    tab.set_default_timeout(Duration::from_secs(999999999));
    check_if_server_running(&tab);

    (chrome, tab)
}

fn token_ids_from_metadata_directory() -> BTreeSet<u128> {
    let mut token_ids = BTreeSet::new();

    for result in fs::read_dir("../../public_s3/metadata_api").unwrap() {
        let dir_entry = result.unwrap();

        let metadata = dir_entry.metadata().unwrap();
        if !metadata.is_file() { continue; }

        let file_name = dir_entry.file_name().into_string().unwrap();
        if !file_name.contains(".json") { continue; }

        let hex_string = file_name.split(".json").next().unwrap();
        if hex_string.len() != 64 { continue; }

        let tail_of_string = &hex_string[32..];
        let token_id = u128::from_str_radix(tail_of_string, 16).unwrap();

        token_ids.insert(token_id);
    }

    return token_ids;
}

fn token_ids_from_output_directory(extension: &'static str) -> BTreeSet<u128> {
    let mut token_ids = BTreeSet::new();

    for result in fs::read_dir(OUTPUT_DIRECTORY).unwrap() {
        let dir_entry = result.unwrap();

        let metadata = dir_entry.metadata().unwrap();
        if !metadata.is_file() { continue; }

        let file_name = dir_entry.file_name().into_string().unwrap();
        if !file_name.contains(extension) { continue; }

        let token_id_string = file_name.split(extension).next().unwrap();

        let token_id = token_id_string.parse::<u128>().unwrap();
        token_ids.insert(token_id);
    }

    token_ids
}

fn check_if_server_running(tab: &Arc<Tab>) {
    let mut success = false;

    // This also seems to fix the first captured image sometimes not having its
    // text scaled correctly so it's worth doing all 3 iterations.
    for i in 0..3 {
        if let Err(_) = tab.navigate_to(&format!("http://localhost:5000/card?tokenID={}&referrer=generate_images", i)) { continue; }
        if let Err(_) = tab.wait_until_navigated() { continue; }

        success = true;
    }

    if !success {
        eprintln!("\nNo server running. Start it with ./bin/serve_website_static\n");
        std::process::exit(1);
    }
}

fn capture_screenshot_of_card_page(tab: &Arc<Tab>, token_id: &str, extension: &str, mut preloaded: bool, next_token_id: &Option<String>) -> (bool, bool) {
    let mut attempts = 3;

    loop {
        if attempts == 0 { return (false, false); }
        attempts -= 1;

        if !preloaded {
            if let Err(_) = tab.navigate_to(&format!("http://localhost:5000/card?tokenID={}&referrer=generate_images", token_id)) { continue; }
        }

        if let Err(_) = tab.wait_until_navigated() { preloaded = false; continue; }

        let png_bytes = match tab.capture_screenshot(ScreenshotFormat::PNG, None, true) {
            Ok(png_bytes) => png_bytes,
            Err(_) => { preloaded = false; continue; }, // Restart this loop iteration to try again.
        };

        // Try to preload the next page in Chrome while we're processing the current screenshot.
        let preloaded_next = match next_token_id {
            Some(t) => tab.navigate_to(&format!("http://localhost:5000/card?tokenID={}&referrer=generate_images", t)).is_ok(),
            None => false,
        };

        // Capture at a higher resolution then downsample to produce a higher quality result.
        let png_image = Reader::with_format(Cursor::new(png_bytes), ImageFormat::Png).decode().unwrap();
        assert_eq!(png_image.width(), CAPTURE_WIDTH);
        assert_eq!(png_image.height(), CAPTURE_HEIGHT);

        let png_image = png_image.resize(OUTPUT_WIDTH, OUTPUT_HEIGHT, FilterType::Lanczos3);
        assert_eq!(png_image.width(), OUTPUT_WIDTH);
        assert_eq!(png_image.height(), OUTPUT_HEIGHT);

        let out_path = format!("{}/{}{}", OUTPUT_DIRECTORY, token_id, extension);
        let mut file = std::fs::File::create(out_path).unwrap();

        if let Some(quality) = JPEG_QUALITY {
            let mut jpeg_bytes = vec![];

            let mut jpeg_encoder = JpegEncoder::new_with_quality(&mut jpeg_bytes, quality);
            jpeg_encoder.encode_image(&png_image).unwrap();

            file.write_all(&jpeg_bytes).unwrap();
        } else {
            png_image.write_to(&mut file, image::ImageOutputFormat::Png).unwrap();
        }

        return (true, preloaded_next);
    }
}
