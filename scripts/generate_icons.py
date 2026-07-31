from pathlib import Path

from PIL import Image, ImageDraw


def make_icon(size: int, output: Path) -> None:
    scale = 4
    canvas_size = size * scale
    image = Image.new("RGBA", (canvas_size, canvas_size), (0, 0, 0, 0))
    draw = ImageDraw.Draw(image)

    radius = int(canvas_size * 0.235)
    draw.rounded_rectangle(
        (0, 0, canvas_size - 1, canvas_size - 1),
        radius=radius,
        fill=(16, 17, 26, 255),
    )

    def box(x1: float, y1: float, x2: float, y2: float) -> tuple[int, int, int, int]:
        return tuple(int(value * canvas_size) for value in (x1, y1, x2, y2))

    violet = (109, 93, 252, 255)
    violet_light = (136, 124, 255, 255)
    draw.rectangle(box(0.226, 0.234, 0.773, 0.391), fill=violet_light)
    draw.rectangle(box(0.226, 0.445, 0.555, 0.766), fill=violet)
    draw.rectangle(box(0.609, 0.445, 0.773, 0.766), fill=(89, 72, 238, 255))
    dot_radius = max(2, int(canvas_size * 0.035))
    dot_x, dot_y = int(canvas_size * 0.71), int(canvas_size * 0.309)
    draw.ellipse(
        (dot_x - dot_radius, dot_y - dot_radius, dot_x + dot_radius, dot_y + dot_radius),
        fill=(255, 255, 255, 255),
    )

    image.resize((size, size), Image.Resampling.LANCZOS).save(output, "PNG")


if __name__ == "__main__":
    icon_directory = Path(__file__).resolve().parents[1] / "public" / "icons"
    icon_directory.mkdir(parents=True, exist_ok=True)
    for icon_size in (16, 32, 48, 128):
        make_icon(icon_size, icon_directory / f"icon-{icon_size}.png")
