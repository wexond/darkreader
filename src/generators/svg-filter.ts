import { createFilterMatrix, Matrix } from "./utils/matrix";
import { cssFilterStyleheetTemplate } from "./css-filter";
import { FilterConfig, InversionFix } from "../definitions";

export function createSVGFilterStylesheet(
  config: FilterConfig,
  url: string,
  frameURL: string,
  inversionFixes: InversionFix[]
) {
  let filterValue: string;
  let reverseFilterValue: string;
  filterValue = "url(#dark-reader-filter)";
  reverseFilterValue = "url(#dark-reader-reverse-filter)";
  return cssFilterStyleheetTemplate(
    filterValue,
    reverseFilterValue,
    config,
    url,
    frameURL,
    inversionFixes
  );
}

function toSVGMatrix(matrix: number[][]) {
  return matrix
    .slice(0, 4)
    .map(m => m.map(m => m.toFixed(3)).join(" "))
    .join(" ");
}

export function getSVGFilterMatrixValue(config: FilterConfig) {
  return toSVGMatrix(createFilterMatrix(config));
}

export function getSVGReverseFilterMatrixValue() {
  return toSVGMatrix(Matrix.invertNHue());
}
