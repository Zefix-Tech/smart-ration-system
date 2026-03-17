import pytesseract
from PIL import Image, ImageDraw, ImageFont
import io
import os

def test_ocr():
    # Create a dummy image with text
    img = Image.new('RGB', (400, 100), color=(255, 255, 255))
    d = ImageDraw.Draw(img)
    try:
        # Try to write some text
        d.text((10, 10), "This is a medical certificate for pregnancy", fill=(0, 0, 0))
        
        # Save to buffer
        buf = io.BytesIO()
        img.save(buf, format='PNG')
        buf.seek(0)
        
        # Test OCR if tesseract is installed
        try:
            text = pytesseract.image_to_string(Image.open(buf))
            print(f"OCR_RESULT: {text.strip()}")
        except Exception as e:
            print(f"OCR_FAILED: {e}")
    except Exception as e:
        print(f"IMG_FAILED: {e}")

if __name__ == "__main__":
    test_ocr()
