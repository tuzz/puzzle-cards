use std::io::{stdout, Write};
use std::fs;
use image::*;
use rayon::prelude::*;
use rayon::iter::IntoParallelIterator;

fn main() {
    let colors = [
        ("red", (1., 0., 0.)),
        ("green", (1., 0., 0.)),
        ("blue", (1., 0., 0.)),
        ("yellow", (1., 0., 0.)),
        ("pink", (1., 0., 0.)),
        ("white", (1., 0., 0.)),
        ("black", (1., 0., 0.)), // Copied only.
    ];

    for (color_name, color) in colors {
        println!("{}", color_name);
        fs::create_dir_all(format!("../../.tmp/cloak_frames/{}", color_name)).unwrap();

        let frames = (42..=401_u32).into_par_iter();

        frames.for_each(|frame| {
            let in_path = format!("../../public/images/types/cloak_frames/frame-{:0>8}.png", frame);
            let out_path = format!("../../.tmp/cloak_frames/{}/frame-{:0>8}.png", color_name, frame);

            colorize_image(&in_path, &out_path, color);
        });
        println!();
    }

    println!();
}

const BLACK: (f32, f32, f32) = (0., 0., 0.);

fn colorize_image(in_path: &str, out_path: &str, color: (f32, f32, f32)) {
    let image = image::open(in_path).unwrap();
    let (width, height) = (image.width(), image.height());

    let bytes = image_to_u8(image);

    let colored = match color == BLACK {
        true => bytes,
        false => colorize(&bytes, color),
    };

    let image = u8s_to_image(&colored, width, height);

    image.save(out_path).unwrap();

    print!(".");
    stdout().flush().unwrap();
}

fn image_to_u8(image: DynamicImage) -> Vec<u8> {
    let has_alpha = image.color().has_alpha();

    let bytes = image.into_bytes();
    if has_alpha { return bytes; }

    let mut output = vec![];

    for chunk in bytes.chunks(3) {
        output.extend(chunk);
        output.push(255);
    }

    output
}

fn colorize(bytes: &[u8], _color: (f32, f32, f32)) -> Vec<u8> {
    bytes.to_vec() // TODO
}

fn u8s_to_image(rgba: &[u8], width: u32, height: u32) -> DynamicImage {
    let mut buffer = ImageBuffer::new(width, height);
    let mut iter = rgba.iter().cloned();

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
