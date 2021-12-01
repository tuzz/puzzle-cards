use headless_chrome::{Browser, LaunchOptionsBuilder, protocol::page::ScreenshotFormat, Tab};
use std::{fs, collections::BTreeSet, sync::Arc};
use std::io::{Cursor, Write, stdout};
use image::{io::Reader, imageops::FilterType, ImageFormat, jpeg::JpegEncoder};

const CAPTURE_HEIGHT: u32 = 2000;
const HEADLESS: bool = true;

const OUTPUT_HEIGHT: u32 = 350;
const OUTPUT_DIRECTORY: &str = "../../public_s3/card_images";

const JPEG_QUALITY: Option<u8> = Some(95); // Or output a lossless PNG if None.

fn main() {
    let capture_width = corresponding_width(CAPTURE_HEIGHT);
    let output_width = corresponding_width(OUTPUT_HEIGHT);

    fs::create_dir_all(OUTPUT_DIRECTORY).unwrap();

    let expected_token_ids = token_ids_from_metadata_directory();
    let actual_token_ids = token_ids_from_output_directory();

    let missing_token_ids = expected_token_ids.difference(&actual_token_ids).collect::<Vec<_>>();
    let surplus_token_ids = actual_token_ids.difference(&expected_token_ids).collect::<Vec<_>>();

    if missing_token_ids.is_empty() { println!("All images already captured. Exiting."); return; }

    surplus_token_ids.iter().for_each(|t| fs::remove_file(format!("{}/{}.png", OUTPUT_DIRECTORY, t)).unwrap());
    if !surplus_token_ids.is_empty() { println!("\nRemoved {} images that have no corresponding metadata.", surplus_token_ids.len()); }

    let options = LaunchOptionsBuilder::default()
        .headless(HEADLESS)
        .window_size(Some((capture_width / 2, CAPTURE_HEIGHT / 2)))
        .build().unwrap();

    let browser = Browser::new(options).unwrap();
    let tab = browser.wait_for_initial_tab().unwrap();

    check_if_server_running(&tab);

    println!("\nCapturing at {}x{} then resizing to {}x{}.", capture_width, CAPTURE_HEIGHT, output_width, OUTPUT_HEIGHT);
    println!("\n{}/{} images already captured.\n", expected_token_ids.len() - missing_token_ids.len(), expected_token_ids.len());

    for (i, token_id) in missing_token_ids.iter().enumerate() {
        loop {
            if let Err(_) = tab.navigate_to(&format!("http://localhost:5000/card?tokenID={}&referrer=generate_images", token_id)) { continue; }
            if let Err(_) = tab.wait_until_navigated() { continue; }

            let png_bytes = match tab.capture_screenshot(ScreenshotFormat::PNG, None, true) {
                Ok(png_bytes) => png_bytes,
                Err(_) => continue, // Restart this loop iteration to try again.
            };

            // Capture at a higher resolution then downsample to produce a higher quality result.
            let png_image = Reader::with_format(Cursor::new(png_bytes), ImageFormat::Png).decode().unwrap();
            let png_image = png_image.resize(output_width, OUTPUT_HEIGHT, FilterType::Lanczos3);

            if let Some(quality) = JPEG_QUALITY {
                let mut jpeg_bytes = vec![];

                let mut jpeg_encoder = JpegEncoder::new_with_quality(&mut jpeg_bytes, quality);
                jpeg_encoder.encode_image(&png_image).unwrap();

                let out_path = format!("{}/{}.jpeg", OUTPUT_DIRECTORY, token_id);
                let mut file = std::fs::File::create(out_path).unwrap();

                file.write_all(&jpeg_bytes).unwrap();
            } else {
                let out_path = format!("{}/{}.png", OUTPUT_DIRECTORY, token_id);
                let mut file = std::fs::File::create(out_path).unwrap();

                png_image.write_to(&mut file, image::ImageOutputFormat::Png).unwrap();
            }

            println!("Captured {}/{}", i + 1, missing_token_ids.len());
            break;
        }
    }

}

fn token_ids_from_metadata_directory() -> BTreeSet<u128> {
    let mut token_ids = BTreeSet::new();

    for result in fs::read_dir("../../public/metadata").unwrap() {
        let dir_entry = result.unwrap();

        let metadata = dir_entry.metadata().unwrap();
        if !metadata.is_file() { continue; }

        let file_name = dir_entry.file_name().into_string().unwrap();
        if !file_name.contains(".json") { continue; }

        let hex_string = file_name.split(".json").next().unwrap();
        let tail_of_string = &hex_string[32..];

        let token_id = u128::from_str_radix(tail_of_string, 16).unwrap();
        token_ids.insert(token_id);
    }

    return token_ids;
}

fn token_ids_from_output_directory() -> BTreeSet<u128> {
    let mut token_ids = BTreeSet::new();

    for result in fs::read_dir(OUTPUT_DIRECTORY).unwrap() {
        let dir_entry = result.unwrap();

        let metadata = dir_entry.metadata().unwrap();
        if !metadata.is_file() { continue; }

        let file_name = dir_entry.file_name().into_string().unwrap();
        if !file_name.contains(".png") { continue; }

        let token_id_string = file_name.split(".png").next().unwrap();

        let token_id = token_id_string.parse::<u128>().unwrap();
        token_ids.insert(token_id);
    }

    token_ids
}

fn corresponding_width(height: u32) -> u32 {
    let width = height as f32 / 21. * 15.;

    // Add a bit on for the box-shadow.
    let width = width * 1.03;

    // Round to next even integer.
    (width / 2.).ceil() as u32 * 2
}

fn check_if_server_running(tab: &Arc<Tab>) {
    print!("\nChecking if the server is running on port 5000");
    let mut success = false;

    // This also seems to fix the first captured image sometimes not having its
    // text scaled correctly so it's worth doing all 5 iterations.
    for i in 0..5 {
        print!(".");
        stdout().flush().unwrap();

        if let Err(_) = tab.navigate_to(&format!("http://localhost:5000/card?tokenID={}&referrer=generate_images", i)) { continue; }
        if let Err(_) = tab.wait_until_navigated() { continue; }

        success = true;
    }

    if success {
        println!();
    } else {
        eprintln!("\nNo server running. Start it with ./bin/serve_website_static\n");
        std::process::exit(1);
    }
}
