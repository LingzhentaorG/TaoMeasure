"""
Standalone script for generating a sample DXF file from road design data.
"""

import os
from ..domain.dxf_exporter import DxfRoadExporter

def get_sample_data():
    """
    Returns a dictionary of sample data for testing the DXF exporter.
    This data structure represents the "data contract" that the DxfRoadExporter expects.
    """
    data = {
        "frame": {
            "outer_rect": [(0, 0), (420, 297)],
            "inner_rect": [(10, 10), (410, 287)]
        },
        "north_arrow": {
            "center": (380, 250),
            "radius": 10
        },
        "centerline": [
            (50, 150), (150, 200), (250, 150), (350, 100)
        ],
        "left_lane": [
            (50, 155), (150, 205), (250, 155), (350, 105)
        ],
        "right_lane": [
            (50, 145), (150, 195), (250, 145), (350, 95)
        ],
        "left_roadbed_edge": [
            (50, 160), (150, 210), (250, 160), (350, 110)
        ],
        "right_roadbed_edge": [
            (50, 140), (150, 190), (250, 140), (350, 90)
        ],
        "pi_line": [
            (40, 200), (150, 200), (260, 150)
        ],
        "key_points": [
            {
                "name": "JD",
                "station": "K0+150.000",
                "point": (150, 200),
                "leader_end": (170, 220)
            },
            {
                "name": "QZ",
                "station": "K0+100.000",
                "point": (100, 175),
                "leader_end": (80, 195)
            },
            {
                "name": "ZQ",
                "station": "K0+200.000",
                "point": (200, 175),
                "leader_end": (220, 195)
            }
        ],
        "hm_stakes": [
            {
                "line": {"start": (100, 170), "end": (100, 180)},
                "label": {"text": "K0+100", "pos": (90, 185), "rotation_deg": 0}
            },
            {
                "line": {"start": (200, 170), "end": (200, 180)},
                "label": {"text": "K0+200", "pos": (190, 185), "rotation_deg": 0}
            }
        ],
        "curve_table": {
            "origin": (20, 80),
            "headers": ["项目", "里程", "坐标X", "坐标Y"],
            "rows": [
                ["JD", "K0+150.000", "150.00", "200.00"],
                ["QZ", "K0+100.000", "100.00", "175.00"],
                ["ZQ", "K0+200.000", "200.00", "175.00"]
            ],
            "col_widths": [30, 50, 40, 40]
        }
    }
    return data

def main():
    """
    Main function to generate the DXF file.
    """
    # Ensure the output directory exists
    output_dir = os.path.join(os.path.dirname(__file__), '..', 'output')
    if not os.path.exists(output_dir):
        os.makedirs(output_dir)
    
    output_filepath = os.path.join(output_dir, "road_design_from_script.dxf")
    
    # Initialize the exporter
    exporter = DxfRoadExporter()
    
    # Get sample data
    design_data = get_sample_data()
    
    # Draw all elements from the data
    exporter.draw_from_data(design_data)
    
    # Save the DXF file
    exporter.save(output_filepath)

if __name__ == "__main__":
    main()
