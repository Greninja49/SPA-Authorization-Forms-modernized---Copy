import cv2
import pytesseract
import re
import json

pytesseract.pytesseract.tesseract_cmd = r"C:\Program Files\Tesseract-OCR\tesseract.exe"

def extract_text_from_image(image_path):
    """Extract text from an image using Tesseract OCR."""
    img = cv2.imread(image_path)
    gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
    _, thresh = cv2.threshold(gray, 150, 255, cv2.THRESH_BINARY_INV)
    custom_config = r'--oem 3 --psm 6'
    extracted_text = pytesseract.image_to_string(thresh, config=custom_config)
    return extracted_text

def extract_form_data(text):
    """Extract specific fields from OCR text."""
    data = {
        "Requester Name": "",
        "SAP Login ID": "",
        "Department": "",
        "Geographical Area": "",
        "Transaction": "",
        "Report": "",
        "Other Object/Activity": "",
        "Transaction Text": "",
        "Report Text": "",
        "Other Object/Activity Text": "",
        "System": "",
        "Client": "",
    }

    requestor_name_pattern = r"Requestor Name:\s*(\w+\s\w+)"
    sap_login_pattern = r"SAP Login ID:\s*(\S+)"
    department_pattern = r"Department:\s*(.+)"
    geo_area_pattern = r"Geographical Area:\s*(.+)"
    transaction_pattern = r"\[X\] Transaction:\s*(.+)"
    report_pattern = r"(\[X\] Report|[ ] Report)\s*([^\n]+)"
    other_object_pattern = r"\[X\] Other Object/Activity:\s*(.+)"
    system_pattern = r"\[X\]\s*(DEV|QAS|PRD)"
    client_pattern = r"\[X\]\s*(120|130|220|300)"


    data["Requester Name"] = re.search(requestor_name_pattern, text).group(1).strip() if re.search(requestor_name_pattern, text) else ""
    data["SAP Login ID"] = re.search(sap_login_pattern, text).group(1).strip() if re.search(sap_login_pattern, text) else ""
    data["Department"] = re.search(department_pattern, text).group(1).strip() if re.search(department_pattern, text) else ""
    data["Geographical Area"] = re.search(geo_area_pattern, text).group(1).strip() if re.search(geo_area_pattern, text) else ""
    data["Transaction"] = re.search(transaction_pattern, text).group(1).strip() if re.search(transaction_pattern, text) else ""
    data["Report"] = re.search(report_pattern, text).group(1).strip() if re.search(report_pattern, text) else ""
    data["Other Object/Activity"] = re.search(other_object_pattern, text).group(1).strip() if re.search(other_object_pattern, text) else ""
    data["System"] = re.search(system_pattern, text).group(1).strip() if re.search(system_pattern, text) else ""
    data["Client"] = re.search(client_pattern, text).group(1).strip() if re.search(client_pattern, text) else ""

    for key, value in data.items():
        data[key] = value if value else "null"

    return json.dumps(data)

if __name__ == "__main__":
    import sys
    if len(sys.argv) != 2:
        print("Usage: python extract_data.py <image_path>")
        sys.exit(1)

    image_path = sys.argv[1]
    extracted_text = extract_text_from_image(image_path)
    extracted_data = extract_form_data(extracted_text)
    print(extracted_data)
