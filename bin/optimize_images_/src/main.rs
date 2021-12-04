use std::{io::Write, fs, collections::HashMap, path::Path, process::Command, process::Stdio};
use walkdir::WalkDir;
use image::{DynamicImage, GenericImageView, ImageBuffer, jpeg::JpegEncoder};
use image::ImageOutputFormat::Png;
use image::imageops::FilterType::Lanczos3;
use rcms::{*, profile::*, link::*};
use rayon::prelude::*;

fn main() {
    optimize_images(settings_per_file());
}

fn optimize_images(settings_per_file: SettingsPerFile) {
    let listing = WalkDir::new("../../image_sources").into_iter().collect::<Vec<_>>();

    listing.into_par_iter().for_each(|result| {
        let dir_entry = result.unwrap();

        let metadata = dir_entry.metadata().unwrap();
        if !metadata.is_file() { return; }

        if let None = dir_entry.path().extension() { return; } // Skip .DS_Store

        let in_path = dir_entry.path().to_str().unwrap().to_string();
        if in_path.contains("frame-") { return; } // Skip frames handled by ./bin/colorize_cloak

        // Comment in to optimize one image:
        //if !in_path.contains("paper") { return; }

        let settings = settings_per_file.get(&in_path)
            .expect(&format!("Please set the optimization settings for {}", in_path));

        let out_path = in_path.replace("image_sources", "public/images").replace(".jpg", ".jpeg");
        let out_dir = Path::new(&out_path).parent().unwrap();

        fs::create_dir_all(out_dir).unwrap();

        println!("Optimizing {} -> {}", in_path, out_path);
        optimize_image(&in_path, &out_path, *settings);
    });
}

fn optimize_image(in_path: &str, out_path: &str, (width, map_p3_to_srgb, jpeg_quality): Settings) {
    let mut image = image::open(in_path).unwrap();
    let has_alpha = has_alpha(&image);

    let out_path = if image.color().has_alpha() && !has_alpha {
        println!("Note: {} does not use its alpha channel so outputting a jpeg", in_path);
        image = discard_alpha(image);

        out_path.replace(".png", ".jpeg")
    } else {
        out_path.to_string()
    };

    if has_alpha && jpeg_quality != 0 {
        panic!("JpegQuality does not affect pngs. Please set it to 0 for {}", in_path);
    } else if !has_alpha && jpeg_quality == 0 {
        panic!("JpegQuality is 0. Please set it to > 0 for {}", in_path);
    }

    let aspect = image.width() as f32 / image.height() as f32;
    let height = (width as f32 / aspect).round() as u32;

    let image = image.resize(width, height, Lanczos3);
    let (width, height) = (image.width(), image.height());

    let image = match map_p3_to_srgb {
        true => {
            let bytes = p3_to_srgb_color_space(image, has_alpha);

            if has_alpha {
                u8s_to_rgba_image(bytes.into_iter(), width, height)
            } else {
                u8s_to_rgb_image(bytes.into_iter(), width, height)
            }
        },
        false => image,
    };

    let mut file = std::fs::File::create(&out_path).unwrap();

    if has_alpha {
        image.write_to(&mut file, Png).unwrap();
        invoke_pngquant(&out_path);
    } else {
        let mut jpeg_bytes = vec![];

        let mut jpeg_encoder = JpegEncoder::new_with_quality(&mut jpeg_bytes, jpeg_quality);
        jpeg_encoder.encode_image(&image).unwrap();

        file.write_all(&jpeg_bytes).unwrap();
    }

    // TODO: only write the file if it has actually changed by checking its md5
}

fn has_alpha(image: &DynamicImage) -> bool {
    if !image.color().has_alpha() { return false; }

    for chunk in image.as_bytes().chunks(4) {
        let is_white = chunk[0] == 255 && chunk[1] == 255 && chunk[2] == 255;
        let is_opaque = chunk[3] == 255;

        // Transparent pixels become white when a png is converted to a jpeg so
        // we need to check if there are any non-white pixels that are transparent.
        // Otherwise, we can safely convert to a jpeg which compresses better.
        if !is_white && !is_opaque { return true; }
    }

    false
}

fn discard_alpha(image: DynamicImage) -> DynamicImage {
    let (width, height) = (image.width(), image.height());

    let bytes = image.into_bytes();
    let mut output = vec![];

    for chunk in bytes.chunks(4) {
        output.extend(&chunk[0..3]);
    }

    u8s_to_rgb_image(output.into_iter(), width, height)
}

fn p3_to_srgb_color_space(image: DynamicImage, has_alpha: bool) -> Vec<u8> {
    let bytes = image.into_bytes();
    let channels = if has_alpha { 4 } else { 3 };

    let srgb_profile = IccProfile::new_srgb();
    let p3_profile = IccProfile::new_display_p3();

    let pipeline = link(
        &[&p3_profile, &srgb_profile],
        &[Intent::Perceptual, Intent::Perceptual],
        &[false, false],
        &[0., 0.],
    ).unwrap();

    let mut buffer = [0.; 3];
    let mut output = vec![];

    for chunk in bytes.chunks(channels) {
        let color = [
            chunk[0] as f64 / 255.,
            chunk[1] as f64 / 255.,
            chunk[2] as f64 / 255.,
        ];

        pipeline.transform(&color, &mut buffer);

        output.push((buffer[0] * 255.).ceil() as u8);
        output.push((buffer[1] * 255.).ceil() as u8);
        output.push((buffer[2] * 255.).ceil() as u8);

        if has_alpha { output.push(chunk[3]); }
    }

    output
}

fn u8s_to_rgba_image<I: Iterator<Item=u8>>(mut iter: I, width: u32, height: u32) -> DynamicImage {
    let mut buffer = ImageBuffer::new(width, height);

    for y in 0..height {
        for x in 0..width {
            let pixel = buffer.get_pixel_mut(x, y);

            let red = iter.next().unwrap();
            let green = iter.next().unwrap();
            let blue = iter.next().unwrap();
            let alpha = iter.next().unwrap();

            *pixel = image::Rgba([red, green, blue, alpha]);
        }
    }

    DynamicImage::ImageRgba8(buffer)
}

fn u8s_to_rgb_image<I: Iterator<Item=u8>>(mut iter: I, width: u32, height: u32) -> DynamicImage {
    let mut buffer = ImageBuffer::new(width, height);

    for y in 0..height {
        for x in 0..width {
            let pixel = buffer.get_pixel_mut(x, y);

            let red = iter.next().unwrap();
            let green = iter.next().unwrap();
            let blue = iter.next().unwrap();

            *pixel = image::Rgb([red, green, blue]);
        }
    }

    DynamicImage::ImageRgb8(buffer)
}

fn invoke_pngquant(out_path: &str) {
    Command::new("pngquant")
        .arg(out_path)
        .arg("--force")
        .arg("--strip")
        .arg("--skip-if-larger")
        .arg("--speed")
        .arg("1")
        .arg("--output")
        .arg(out_path)
        .stdout(Stdio::piped())
        .spawn()
        .unwrap();
}

type SettingsPerFile = HashMap<String, Settings>;
type Settings = (Width, MapP3ToSrgb, JpegQuality);

type Width = u32;
type MapP3ToSrgb = bool;
type JpegQuality = u8;

fn settings_per_file() -> SettingsPerFile {
    HashMap::from_iter([
        ("../../image_sources/card_back.png".to_string(), (100, true, 90)),
        ("../../image_sources/coffee_stain_1.png".to_string(), (100, false, 0)),
        ("../../image_sources/coffee_stain_2.png".to_string(), (100, false, 0)),
        ("../../image_sources/coffee_stain_3.png".to_string(), (100, false, 0)),
        ("../../image_sources/coffee_stain_4.png".to_string(), (100, false, 0)),
        ("../../image_sources/coffee_stain_5.png".to_string(), (100, false, 0)),
        ("../../image_sources/coffee_stain_6.png".to_string(), (100, false, 0)),
        ("../../image_sources/color_particles.png".to_string(), (100, false, 90)),
        ("../../image_sources/cross_mark.png".to_string(), (100, false, 0)),
        ("../../image_sources/crossed_hourglass.png".to_string(), (100, true, 0)),
        ("../../image_sources/dirt.png".to_string(), (100, false, 90)),
        ("../../image_sources/felt_cloth.jpeg".to_string(), (100, false, 90)),
        ("../../image_sources/fingerprint_1.png".to_string(), (100, false, 0)),
        ("../../image_sources/fingerprint_2.png".to_string(), (100, false, 0)),
        ("../../image_sources/foil_mesh.jpeg".to_string(), (100, false, 90)),
        ("../../image_sources/folded_corner.png".to_string(), (100, true, 0)),
        ("../../image_sources/glasses_icon.png".to_string(), (100, true, 0)),
        ("../../image_sources/gold_glitter.jpeg".to_string(), (100, false, 90)),
        ("../../image_sources/helix_icon.png".to_string(), (100, true, 0)),
        ("../../image_sources/hourglass.png".to_string(), (100, true, 0)),
        ("../../image_sources/ink_stain_1.png".to_string(), (100, false, 0)),
        ("../../image_sources/ink_stain_2.png".to_string(), (100, false, 0)),
        ("../../image_sources/ink_stain_3.png".to_string(), (100, false, 0)),
        ("../../image_sources/ink_stain_4.png".to_string(), (100, false, 0)),
        ("../../image_sources/ink_stain_5.png".to_string(), (100, false, 0)),
        ("../../image_sources/metamask_logo.png".to_string(), (100, false, 0)),
        ("../../image_sources/padlock.png".to_string(), (100, true, 0)),
        ("../../image_sources/paper.jpeg".to_string(), (100, false, 90)),
        ("../../image_sources/peeling_foil.png".to_string(), (100, false, 0)),
        ("../../image_sources/poker_chip_black.png".to_string(), (100, false, 0)),
        ("../../image_sources/poker_chip_white.png".to_string(), (100, false, 0)),
        ("../../image_sources/rock.png".to_string(), (100, false, 90)),
        ("../../image_sources/shield_icon.png".to_string(), (100, true, 0)),
        ("../../image_sources/signature_1.png".to_string(), (100, false, 0)),
        ("../../image_sources/signature_2.png".to_string(), (100, false, 0)),
        ("../../image_sources/signature_3.png".to_string(), (100, false, 0)),
        ("../../image_sources/signature_4.png".to_string(), (100, false, 0)),
        ("../../image_sources/silver_foil.jpeg".to_string(), (100, false, 90)),
        ("../../image_sources/silver_glitter.jpeg".to_string(), (100, false, 90)),
        ("../../image_sources/walls_icon.png".to_string(), (100, true, 0)),
        ("../../image_sources/wood.jpeg".to_string(), (100, false, 90)),
        ("../../image_sources/worship_stick_base.png".to_string(), (100, true, 0)),
        ("../../image_sources/worship_stick_sun.png".to_string(), (100, true, 0)),
        ("../../image_sources/yellow_sun.png".to_string(), (100, true, 0)),
        ("../../image_sources/yellowing.png".to_string(), (100, true, 0)),

        ("../../image_sources/artwork/ancient_door.png".to_string(), (100, true, 0)),
        ("../../image_sources/artwork/anglerfish.png".to_string(), (100, true, 0)),
        ("../../image_sources/artwork/baby_crab.png".to_string(), (100, true, 0)),
        ("../../image_sources/artwork/big_tree.png".to_string(), (100, true, 0)),
        ("../../image_sources/artwork/black_hourglass.png".to_string(), (100, true, 0)),
        ("../../image_sources/artwork/book_cover.png".to_string(), (100, true, 0)),
        ("../../image_sources/artwork/car_body.png".to_string(), (100, true, 0)),
        ("../../image_sources/artwork/car_tyre.png".to_string(), (100, true, 0)),
        ("../../image_sources/artwork/frozen_moon.png".to_string(), (100, true, 0)),
        ("../../image_sources/artwork/frozen_sun.png".to_string(), (100, true, 0)),
        ("../../image_sources/artwork/helix_coral.png".to_string(), (100, true, 0)),
        ("../../image_sources/artwork/ice_block.png".to_string(), (100, true, 0)),
        ("../../image_sources/artwork/jellyfish.png".to_string(), (100, true, 0)),
        ("../../image_sources/artwork/ladder_tree.png".to_string(), (100, true, 0)),
        ("../../image_sources/artwork/overgrown_door.png".to_string(), (100, true, 0)),
        ("../../image_sources/artwork/player_sketch.png".to_string(), (100, true, 0)),
        ("../../image_sources/artwork/seaweed.png".to_string(), (100, true, 0)),
        ("../../image_sources/artwork/small_tree.png".to_string(), (100, true, 0)),
        ("../../image_sources/artwork/solar_spikes.png".to_string(), (100, true, 0)),
        ("../../image_sources/artwork/starfish.png".to_string(), (100, true, 0)),
        ("../../image_sources/artwork/sun_padlock.png".to_string(), (100, true, 0)),
        ("../../image_sources/artwork/torch_coral.png".to_string(), (100, true, 0)),
        ("../../image_sources/artwork/two_torches.png".to_string(), (100, true, 0)),
        ("../../image_sources/artwork/white_hourglass.png".to_string(), (100, true, 0)),

        ("../../image_sources/types/active_black_moon.png".to_string(), (100, false, 0)),
        ("../../image_sources/types/active_black_sun.png".to_string(), (100, false, 0)),
        ("../../image_sources/types/active_blue_moon.png".to_string(), (100, false, 0)),
        ("../../image_sources/types/active_blue_sun.png".to_string(), (100, false, 0)),
        ("../../image_sources/types/active_green_moon.png".to_string(), (100, false, 0)),
        ("../../image_sources/types/active_green_sun.png".to_string(), (100, false, 0)),
        ("../../image_sources/types/active_pink_moon.png".to_string(), (100, false, 0)),
        ("../../image_sources/types/active_pink_sun.png".to_string(), (100, false, 0)),
        ("../../image_sources/types/active_red_moon.png".to_string(), (100, false, 0)),
        ("../../image_sources/types/active_red_sun.png".to_string(), (100, false, 0)),
        ("../../image_sources/types/active_white_moon.png".to_string(), (100, false, 0)),
        ("../../image_sources/types/active_white_sun.png".to_string(), (100, false, 0)),
        ("../../image_sources/types/active_yellow_moon.png".to_string(), (100, false, 0)),
        ("../../image_sources/types/active_yellow_sun.png".to_string(), (100, false, 0)),
        ("../../image_sources/types/black_blur.png".to_string(), (100, false, 0)),
        ("../../image_sources/types/black_lens.png".to_string(), (100, false, 0)),
        ("../../image_sources/types/black_moon.png".to_string(), (100, true, 0)),
        ("../../image_sources/types/black_star.png".to_string(), (100, true, 0)),
        ("../../image_sources/types/black_sun.png".to_string(), (100, true, 0)),
        ("../../image_sources/types/blue_arrow.png".to_string(), (100, true, 0)),
        ("../../image_sources/types/blue_blur.png".to_string(), (100, false, 0)),
        ("../../image_sources/types/blue_lens.png".to_string(), (100, true, 0)),
        ("../../image_sources/types/blue_moon.png".to_string(), (100, true, 0)),
        ("../../image_sources/types/blue_star.png".to_string(), (100, true, 0)),
        ("../../image_sources/types/blue_sun.png".to_string(), (100, true, 0)),
        ("../../image_sources/types/climb_1.png".to_string(), (100, true, 0)),
        ("../../image_sources/types/climb_2.png".to_string(), (100, true, 0)),
        ("../../image_sources/types/clock.png".to_string(), (100, true, 0)),
        ("../../image_sources/types/crab_point_left.png".to_string(), (100, true, 0)),
        ("../../image_sources/types/crab_point_right.png".to_string(), (100, true, 0)),
        ("../../image_sources/types/crab_standing.png".to_string(), (100, true, 0)),
        ("../../image_sources/types/dive.png".to_string(), (100, true, 0)),
        ("../../image_sources/types/door_closed.png".to_string(), (100, true, 0)),
        ("../../image_sources/types/door_open.png".to_string(), (100, true, 0)),
        ("../../image_sources/types/eclipse.png".to_string(), (100, true, 0)),
        ("../../image_sources/types/eclipse_particles.png".to_string(), (100, false, 0)),
        ("../../image_sources/types/green_arrow.png".to_string(), (100, true, 0)),
        ("../../image_sources/types/green_blur.png".to_string(), (100, false, 0)),
        ("../../image_sources/types/green_lens.png".to_string(), (100, true, 0)),
        ("../../image_sources/types/green_moon.png".to_string(), (100, true, 0)),
        ("../../image_sources/types/green_star.png".to_string(), (100, true, 0)),
        ("../../image_sources/types/green_sun.png".to_string(), (100, true, 0)),
        ("../../image_sources/types/helix1.png".to_string(), (100, true, 0)),
        ("../../image_sources/types/helix2.png".to_string(), (100, true, 0)),
        ("../../image_sources/types/idle_back.png".to_string(), (100, true, 0)),
        ("../../image_sources/types/idle_front.png".to_string(), (100, true, 0)),
        ("../../image_sources/types/idle_left.png".to_string(), (100, true, 0)),
        ("../../image_sources/types/idle_right.png".to_string(), (100, true, 0)),
        ("../../image_sources/types/inactive_black_moon.png".to_string(), (100, false, 0)),
        ("../../image_sources/types/inactive_black_sun.png".to_string(), (100, false, 0)),
        ("../../image_sources/types/inactive_blue_moon.png".to_string(), (100, false, 0)),
        ("../../image_sources/types/inactive_blue_sun.png".to_string(), (100, false, 0)),
        ("../../image_sources/types/inactive_green_moon.png".to_string(), (100, false, 0)),
        ("../../image_sources/types/inactive_green_sun.png".to_string(), (100, false, 0)),
        ("../../image_sources/types/inactive_pink_moon.png".to_string(), (100, false, 0)),
        ("../../image_sources/types/inactive_pink_sun.png".to_string(), (100, false, 0)),
        ("../../image_sources/types/inactive_red_moon.png".to_string(), (100, false, 0)),
        ("../../image_sources/types/inactive_red_sun.png".to_string(), (100, false, 0)),
        ("../../image_sources/types/inactive_white_moon.png".to_string(), (100, false, 0)),
        ("../../image_sources/types/inactive_white_sun.png".to_string(), (100, false, 0)),
        ("../../image_sources/types/inactive_yellow_moon.png".to_string(), (100, false, 0)),
        ("../../image_sources/types/inactive_yellow_sun.png".to_string(), (100, false, 0)),
        ("../../image_sources/types/jump_left_1.png".to_string(), (100, true, 0)),
        ("../../image_sources/types/jump_left_2.png".to_string(), (100, true, 0)),
        ("../../image_sources/types/jump_left_3.png".to_string(), (100, true, 0)),
        ("../../image_sources/types/jump_left_4.png".to_string(), (100, true, 0)),
        ("../../image_sources/types/jump_left_5.png".to_string(), (100, true, 0)),
        ("../../image_sources/types/jump_left_6.png".to_string(), (100, true, 0)),
        ("../../image_sources/types/jump_right_1.png".to_string(), (100, true, 0)),
        ("../../image_sources/types/jump_right_2.png".to_string(), (100, true, 0)),
        ("../../image_sources/types/jump_right_3.png".to_string(), (100, true, 0)),
        ("../../image_sources/types/jump_right_4.png".to_string(), (100, true, 0)),
        ("../../image_sources/types/jump_right_5.png".to_string(), (100, true, 0)),
        ("../../image_sources/types/jump_right_6.png".to_string(), (100, true, 0)),
        ("../../image_sources/types/ladder.png".to_string(), (100, true, 0)),
        ("../../image_sources/types/map.png".to_string(), (100, true, 0)),
        ("../../image_sources/types/pink_arrow.png".to_string(), (100, true, 0)),
        ("../../image_sources/types/pink_blur.png".to_string(), (100, false, 0)),
        ("../../image_sources/types/pink_lens.png".to_string(), (100, true, 0)),
        ("../../image_sources/types/pink_moon.png".to_string(), (100, true, 0)),
        ("../../image_sources/types/pink_star.png".to_string(), (100, true, 0)),
        ("../../image_sources/types/pink_sun.png".to_string(), (100, true, 0)),
        ("../../image_sources/types/purple_arrow.png".to_string(), (100, true, 0)),
        ("../../image_sources/types/red_arrow.png".to_string(), (100, true, 0)),
        ("../../image_sources/types/red_blur.png".to_string(), (100, false, 0)),
        ("../../image_sources/types/red_lens.png".to_string(), (100, true, 0)),
        ("../../image_sources/types/red_moon.png".to_string(), (100, true, 0)),
        ("../../image_sources/types/red_star.png".to_string(), (100, true, 0)),
        ("../../image_sources/types/red_sun.png".to_string(), (100, true, 0)),
        ("../../image_sources/types/sunglasses_frame.png".to_string(), (100, true, 0)),
        ("../../image_sources/types/swim_left_1.png".to_string(), (100, true, 0)),
        ("../../image_sources/types/swim_left_2.png".to_string(), (100, true, 0)),
        ("../../image_sources/types/swim_left_3.png".to_string(), (100, true, 0)),
        ("../../image_sources/types/swim_left_4.png".to_string(), (100, true, 0)),
        ("../../image_sources/types/swim_left_5.png".to_string(), (100, true, 0)),
        ("../../image_sources/types/swim_left_6.png".to_string(), (100, true, 0)),
        ("../../image_sources/types/swim_left_7.png".to_string(), (100, true, 0)),
        ("../../image_sources/types/swim_left_8.png".to_string(), (100, true, 0)),
        ("../../image_sources/types/swim_right_1.png".to_string(), (100, true, 0)),
        ("../../image_sources/types/swim_right_2.png".to_string(), (100, true, 0)),
        ("../../image_sources/types/swim_right_3.png".to_string(), (100, true, 0)),
        ("../../image_sources/types/swim_right_4.png".to_string(), (100, true, 0)),
        ("../../image_sources/types/swim_right_5.png".to_string(), (100, true, 0)),
        ("../../image_sources/types/swim_right_6.png".to_string(), (100, true, 0)),
        ("../../image_sources/types/swim_right_7.png".to_string(), (100, true, 0)),
        ("../../image_sources/types/swim_right_8.png".to_string(), (100, true, 0)),
        ("../../image_sources/types/telescope.png".to_string(), (100, true, 0)),
        ("../../image_sources/types/telescope_particles.png".to_string(), (100, false, 0)),
        ("../../image_sources/types/tread_water_1.png".to_string(), (100, true, 0)),
        ("../../image_sources/types/tread_water_2.png".to_string(), (100, true, 0)),
        ("../../image_sources/types/tread_water_3.png".to_string(), (100, true, 0)),
        ("../../image_sources/types/tread_water_4.png".to_string(), (100, true, 0)),
        ("../../image_sources/types/tread_water_5.png".to_string(), (100, true, 0)),
        ("../../image_sources/types/walk_left_1.png".to_string(), (100, true, 0)),
        ("../../image_sources/types/walk_left_2.png".to_string(), (100, true, 0)),
        ("../../image_sources/types/walk_left_3.png".to_string(), (100, true, 0)),
        ("../../image_sources/types/walk_left_4.png".to_string(), (100, true, 0)),
        ("../../image_sources/types/walk_left_5.png".to_string(), (100, true, 0)),
        ("../../image_sources/types/walk_left_6.png".to_string(), (100, true, 0)),
        ("../../image_sources/types/walk_left_7.png".to_string(), (100, true, 0)),
        ("../../image_sources/types/walk_left_8.png".to_string(), (100, true, 0)),
        ("../../image_sources/types/walk_right_1.png".to_string(), (100, true, 0)),
        ("../../image_sources/types/walk_right_2.png".to_string(), (100, true, 0)),
        ("../../image_sources/types/walk_right_3.png".to_string(), (100, true, 0)),
        ("../../image_sources/types/walk_right_4.png".to_string(), (100, true, 0)),
        ("../../image_sources/types/walk_right_5.png".to_string(), (100, true, 0)),
        ("../../image_sources/types/walk_right_6.png".to_string(), (100, true, 0)),
        ("../../image_sources/types/walk_right_7.png".to_string(), (100, true, 0)),
        ("../../image_sources/types/walk_right_8.png".to_string(), (100, true, 0)),
        ("../../image_sources/types/white_arrow.png".to_string(), (100, true, 0)),
        ("../../image_sources/types/white_lens.png".to_string(), (100, true, 0)),
        ("../../image_sources/types/white_moon.png".to_string(), (100, true, 0)),
        ("../../image_sources/types/white_star.png".to_string(), (100, true, 0)),
        ("../../image_sources/types/white_sun.png".to_string(), (100, true, 0)),
        ("../../image_sources/types/yellow_arrow.png".to_string(), (100, true, 0)),
        ("../../image_sources/types/yellow_blur.png".to_string(), (100, false, 0)),
        ("../../image_sources/types/yellow_lens.png".to_string(), (100, true, 0)),
        ("../../image_sources/types/yellow_moon.png".to_string(), (100, true, 0)),
        ("../../image_sources/types/yellow_star.png".to_string(), (100, true, 0)),
        ("../../image_sources/types/yellow_sun.png".to_string(), (100, true, 0)),
    ])
}
