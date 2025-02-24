import { expect, test } from "vitest";
import { createPerPageRegions } from "../../Preprocess";
import { DocIntResponse } from "../../Types";

import json0 from "../../../../../local-backend/files/PressReleaseFY24Q3.pdf.json";
import json1 from "../../../../../local-backend/files/Microsoft 10Q FY24Q3 1.pdf.json";
import json2 from "../../../../../local-backend/files/compressed.tracemonkey-pldi-09.pdf.json";

const createRegionsTest = (description: string, di: DocIntResponse) =>
  test(`createRegionsTest | ${description}`, () => {
    createPerPageRegions(di);

    for (const page of di.analyzeResult.pages) {
      expect(page.regions).toBeDefined();
      // E.g. check each region references a paragraph that mentions pageNumber = page.pageNumber
      for (const region of page.regions!) {
        expect(region.paragraphIndex).toBeGreaterThanOrEqual(0);
        expect(region.paragraphIndex).toBeLessThan(
          di.analyzeResult.paragraphs.length
        );

        const para = di.analyzeResult.paragraphs[region.paragraphIndex];
        const hasCurrentPage = para.boundingRegions.some(
          (br) => br.pageNumber === page.pageNumber
        );
        expect(hasCurrentPage).toBe(true);
      }
    }
  });

const di0 = json0 as DocIntResponse;
const di1 = json1 as DocIntResponse;
const di2 = json2 as DocIntResponse;

createRegionsTest("PressReleaseFY24Q3.pdf.json", di0);
createRegionsTest("Microsoft 10Q FY24Q3 1.pdf.json", di1);
createRegionsTest("compressed.tracemonkey-pldi-09.pdf.json", di2);
