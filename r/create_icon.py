from PIL import Image, ImageDraw

def create_icon():
    # Create a new image with a green background
    size = 256
    image = Image.new('RGBA', (size, size), (0, 150, 0, 0))
    draw = ImageDraw.Draw(image)
    
    # Draw a rounded rectangle
    draw.rounded_rectangle([20, 20, size-20, size-20], radius=30, fill=(0, 150, 0, 255))
    
    # Draw RFID card lines
    line_color = (255, 255, 255, 255)
    for y in range(80, 200, 30):
        draw.line([(60, y), (size-60, y)], fill=line_color, width=10)
    
    # Save in different sizes for the ico file
    sizes = [(256, 256), (128, 128), (64, 64), (32, 32), (16, 16)]
    images = []
    for s in sizes:
        images.append(image.resize(s, Image.Resampling.LANCZOS))
    
    # Save as ICO file
    images[0].save('icon.ico', format='ICO', sizes=sizes)

if __name__ == "__main__":
    create_icon() 