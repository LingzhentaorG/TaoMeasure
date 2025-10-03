"""
Command-line pipeline that converts curve-survey data into DXF output.

The script can ingest either raw calculation results (by delegating to
CurveMeasurementDataProcessor) or already-normalised data structures and
emits a DXF file via the refactored DxfRoadExporter.
"""

from __future__ import annotations

import argparse
import json
from pathlib import Path
from typing import Any, Dict, List, Optional, Union

from ..domain.curve_data_processor import CurveMeasurementDataProcessor
from ..domain.dxf_exporter import DxfRoadExporter

AngleHint = Union[int, str]


class CurveDxfPipeline:
    """Glue code that ties data normalisation and DXF export together."""

    def __init__(
        self,
        *,
        dxf_version: str = "R2010",
        layer_overrides: Optional[Dict[str, str]] = None,
    ) -> None:
        """Initialise helper utilities with optional DXF configuration overrides."""
        self.processor = CurveMeasurementDataProcessor()
        self.dxf_version = dxf_version
        self.layer_overrides = layer_overrides or {}

    def build_from_file(
        self,
        input_path: Path,
        output_path: Path,
        *,
        treat_as_raw: bool,
        angle_columns: Optional[List[AngleHint]] = None,
        numeric_precision: int = 3,
    ) -> None:
        """Load input data, normalise when required, and persist a DXF file."""
        data = self._load_input_data(
            input_path,
            treat_as_raw=treat_as_raw,
            angle_columns=angle_columns,
            numeric_precision=numeric_precision,
        )
        exporter = DxfRoadExporter(
            dxf_version=self.dxf_version,
            layer_overrides=self.layer_overrides,
        )
        exporter.draw_from_data(data)
        exporter.save(str(output_path))

    def _load_input_data(
        self,
        input_path: Path,
        *,
        treat_as_raw: bool,
        angle_columns: Optional[List[AngleHint]],
        numeric_precision: int,
    ) -> Dict[str, Any]:
        """Return a canonical data dictionary ready for DXF rendering."""
        if treat_as_raw:
            raw_payload = self.processor.load_raw_data(input_path)
            return self.processor.normalize(
                raw_payload,
                angle_columns=angle_columns,
                numeric_precision=numeric_precision,
            )
        return self._load_normalised_payload(input_path)

    def _load_normalised_payload(self, path: Path) -> Dict[str, Any]:
        """Read an already-normalised JSON payload from disk."""
        with path.open("r", encoding="utf-8") as stream:
            return json.load(stream)


def parse_cli() -> argparse.Namespace:
    """Configure and parse CLI arguments for the DXF export pipeline."""
    parser = argparse.ArgumentParser(
        description="Generate a DXF file from curve-survey data",
    )
    parser.add_argument("input", type=Path, help="Path to raw or normalised JSON data")
    parser.add_argument("output", type=Path, help="Destination DXF file path")
    parser.add_argument(
        "--raw",
        action="store_true",
        help="Interpret the input file as raw calculation output that needs normalisation",
    )
    parser.add_argument(
        "--angle-column",
        dest="angle_columns",
        action="append",
        help="Columns (indices or header fragments) to treat as angles during normalisation",
    )
    parser.add_argument(
        "--precision",
        dest="precision",
        type=int,
        default=3,
        help="Decimal places for numeric formatting when normalising raw data",
    )
    parser.add_argument(
        "--dxf-version",
        dest="dxf_version",
        default="R2010",
        help="DXF version string passed to ezdxf.new (default: R2010)",
    )
    parser.add_argument(
        "--layer-map",
        dest="layer_map",
        type=Path,
        help="Optional JSON file with logical-layer to DXF-layer overrides",
    )
    return parser.parse_args()


def load_layer_overrides(path: Optional[Path]) -> Optional[Dict[str, str]]:
    """Load layer overrides from a JSON mapping if a path is provided."""
    if path is None:
        return None
    with path.open("r", encoding="utf-8") as stream:
        payload = json.load(stream)
    if not isinstance(payload, dict):
        raise ValueError("layer_map file must contain a JSON object mapping logical keys to layer names")
    return {str(key): str(value) for key, value in payload.items()}


def coerce_angle_hints(raw_hints: Optional[List[str]]) -> Optional[List[AngleHint]]:
    """Convert CLI-provided angle hints into typed values for the processor."""
    if not raw_hints:
        return None
    hints: List[AngleHint] = []
    for hint in raw_hints:
        try:
            hints.append(int(hint))
        except (TypeError, ValueError):
            hints.append(hint)
    return hints


def main() -> None:
    """Entry point: parse arguments, run the pipeline, and report success."""
    args = parse_cli()
    layer_overrides = load_layer_overrides(args.layer_map)
    angle_hints = coerce_angle_hints(args.angle_columns)

    pipeline = CurveDxfPipeline(
        dxf_version=args.dxf_version,
        layer_overrides=layer_overrides,
    )
    pipeline.build_from_file(
        args.input,
        args.output,
        treat_as_raw=args.raw,
        angle_columns=angle_hints,
        numeric_precision=args.precision,
    )


if __name__ == "__main__":
    main()
