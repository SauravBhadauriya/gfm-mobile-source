//
///
///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//|  ONE-TIME RUN SCRIPT TO GENERATE DIFFERENT ICON FILES FROM THE OLD Icons.js into different .tsx files for modularity.  |
///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//
//
//
//

import fs from "fs";
import path from "path";
const input_file = "C:/Projects/naught-icons.tsx";
const output_dir = "C:/gm/apps/gully-fame-mobile/src/icons";
const BASE_IMPORTS = `import React from "react";
import { Svg, Circle, Path, Rect, G, Defs, LinearGradient, Stop, Pattern, Image } from "react-native-svg";

`;

const fileContent = fs.readFileSync(input_file, "utf-8");

const rawComponents = fileContent.split("export const ").slice(1);
const existingFiles = fs.readdirSync(path.join(output_dir));
let barrelExports = "";
// for (let i = 0; i < existingFiles.length; i++) {
//   const [name, ext] = existingFiles[i].split(".");
//   if (name === "index" || name === "ImageIcons") continue;
//   barrelExports += `export { ${name} } from "./${name}";\n`;
// }

rawComponents.forEach((component) => {
  const iconName = component.substring(0, component.indexOf("=")).trim();
  if (existingFiles.includes(`${iconName}.tsx`)) return;
  const componentCode = `${BASE_IMPORTS}export const ${component}`;
  fs.writeFileSync(
    path.join(output_dir, `${iconName}.tsx`),
    componentCode.trim() + "\n",
  );
  barrelExports += `export { ${iconName} } from "./${iconName}";\n`;
  console.log(`Wrote new file ${iconName}.tsx`);
});
fs.appendFileSync(path.join(output_dir, "index.ts"), barrelExports);
console.log("✅ Outputted Complete Barrel File");
