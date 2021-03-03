let labsEl = document.getElementById("labs");
let cCodesEl = document.getElementById("c_codes");
let xCodesEl = document.getElementById("x_codes");
let bCodesEl = document.getElementById("b_codes");
let excavatorsEl = document.getElementById("excavator");

let selectedFile;
let labsArr = [];
let cCodeArr = [];
let xCodeArr = [];
let bCodeArr = [];
let t210Arr = [];

// console.log(window.XLSX);
document.getElementById("input").addEventListener("change", (event) => {
  selectedFile = event.target.files[0];
  // console.log(selectedFile);
});

document.getElementById("button").addEventListener("click", () => {
  // XLSX.utils.json_to_sheet(data, "out.xlsx");
  if (selectedFile) {
    let fileReader = new FileReader();
    fileReader.readAsBinaryString(selectedFile);
    fileReader.onload = (event) => {
      let data = event.target.result;
      let workbook = XLSX.read(data, { type: "binary" });
      // console.log(workbook);
      //this is a place holder for the former code
      // console.log(workbook.Sheets["AAF Cost Worksheet"]);
      let costWorksheet = workbook.Sheets["AAF Cost Worksheet"];
      let aCol = [];
      let dCol = [];
      let iCol = [];
      // console.log(costWorksheet);

      for (let val in costWorksheet) {
        // console.log(costWorksheet[val]);
        let letter = val.charAt(0);
        let number = val.slice(1);

        if (letter == "A" && Number(number) > 8) {
          // console.log(val);
          // console.log(costWorksheet[val].v);

          aCol.push([Number(number), costWorksheet[val].v]);
          // console.log(aCol);
        }
        if (letter == "D" && Number(number) > 8) {
          dCol.push([Number(number), costWorksheet[val].v]);
        }
        if (letter == "I" && Number(number) > 8) {
          iCol.push([Number(number), costWorksheet[val].v]);
        }
      }
      // console.log(aCol);
      findLabs(aCol);
      addPrices(labsArr, iCol);
      addPrices(labsArr, dCol);
      addLSCA(labsArr, lsca);
      // console.log(labsArr);
      // console.log(dCol);
      // console.log(iCol);
      findCcodes(aCol);
      addPrices(cCodeArr, iCol);
      addPrices(cCodeArr, dCol);
      // console.log(cCodeArr);
      createLabEls(labsArr);
      createCcodesEls(cCodeArr);
      findT210(aCol);
      handleT210(t210Arr);

      // let labsArr = aCol.forEach((el) => el.length);
      // console.log(labsArr);
    };
  }
});

function findLabs(a) {
  for (ucr of a) {
    if (ucr[1] == "T245" || ucr[1].slice(0, 3) == "M22") {
      labsArr.push(ucr);
    }
  }
}

function addPrices(labray, pricesray) {
  for (lineitem of pricesray) {
    for (item of labray) {
      if (lineitem[0] == item[0]) {
        item.push(lineitem[1]);
      }
    }
  }
}

function addLSCA(labray, lsca) {
  for (lineitem of lsca) {
    for (item of labray) {
      if (lineitem[0] == item[1]) {
        item.push(lineitem[1]);
      }
    }
  }
}

function findCcodes(a) {
  for (ucr of a) {
    if (ucr[1].slice(0, 2) == "C2") {
      cCodeArr.push(ucr);
    }
  }
}

function findXcodes(a) {
  for (ucr of a) {
    if (ucr[1].slice(0, 2) == "X0") {
      xCodeArr.push(ucr);
    }
  }
}

function findBcodes(a) {
  for (ucr of a) {
    if (ucr[1].slice(0, 2) == "B0") {
      bCodeArr.push(ucr);
    }
  }
}

function findT210(a) {
  for (ucr of a) {
    if (ucr[1].slice(0, 4) == "T210") {
      t210Arr.push(ucr);
      console.log("find t has ran");
    }
  }
}

function createCcodesEls(ca) {
  ca.forEach((el) => {
    cCodeEl = document.createElement("DIV");
    cCodeEl.innerHTML = `
    <div class="${el[1]}">
    <article class="lab-card">
    <p> C Code: ${el[1]}, Price: $${el[2]}, Qty: ${el[3]}</p>
    <input type="text" class="c-input" placeholder="invoiced unit price"></input>
    <button id="submit-c">Submit</button>
        </article>
        </div>`;
    cCodesEl.appendChild(cCodeEl);
  });
}

function createLabEls(la) {
  la.forEach((el) => {
    labEl = document.createElement("DIV");
    labEl.innerHTML = `
    <div class="${el[1]}">
    <article class="lab-card">
    <p> Lab Code: ${el[1]}, Price: $${el[2]}, Qty: ${el[3]}, LSCA.max: ${el[4]}</p>
    <input type="text" class="lab-input" placeholder="invoiced unit price"></input>
    <button id="submit-lab">Submit</button>
        </article>
        </div>
`;
    labsEl.appendChild(labEl);
  });
}

labsEl.addEventListener("click", function (e) {
  if (e.target && e.target.id == "submit-lab") {
    // let input = document.querySelector(".lab-input");
    // let inputVal = input.value;
    let inputVal = Number(e.target.parentNode.children[1].value);
    console.log(inputVal);

    let identifier = e.target.parentNode.parentNode.className;
    console.log(identifier);

    function addInputToLabArr(arr, id) {
      for (ucr of arr) {
        if (ucr[1] == id) {
          ucr.push(Number(inputVal));
          console.log(ucr);
        }
      }
    }
    addInputToLabArr(labsArr, identifier);
    console.log(labsArr);

    function applyLSCA(arr, id) {
      for (ucr of arr) {
        if (ucr[1] == id) {
          // "u4 is me", "u5 is claimed", "u3 is units", "u2 is totalamt"
          let units = ucr[3];
          let totalamt = ucr[2];
          let max = ucr[4];
          let claimed = ucr[5];
          let diff = max - claimed;

          let elig;
          if (claimed + 0.5 * diff > max) {
            elig = max;
          } else {
            elig = claimed + 0.5 * diff;
          }

          let eligTotal = elig * units;
          let p = document.createElement("p");

          // console.log(elig);
          // console.log(eligTotal);

          if (totalamt > elig * units) {
            e.target.parentNode.appendChild(p);
            p.innerText = `The consultant failed to use the LSCA, costs in excess will be denied D146. $${totalamt} claimed  - $${(
              elig * units
            ).toFixed(2)} = $${(totalamt - elig * units).toFixed(2)}`;
          } else {
            e.target.parentNode.appendChild(p);
            p.innerText = `The consultant claimed costs within the eligible amount, $${totalamt} was claimed and $${(
              elig * units
            ).toFixed(2)} was eligible.`;
          }
        }
      }
    }
    applyLSCA(labsArr, identifier);
  }
});

cCodesEl.addEventListener("click", function (e) {
  if (e.target && e.target.id == "submit-c") {
    let inputVal = Number(e.target.parentNode.children[1].value);
    console.log(inputVal);

    let identifier = e.target.parentNode.parentNode.className;
    console.log(identifier);

    function addInputToCArr(arr, id) {
      for (ucr of arr) {
        if (ucr[1] == id) {
          ucr.push(Number(inputVal));
          console.log(ucr);
        }
      }
    }
    addInputToCArr(cCodeArr, identifier);
    console.log(cCodeArr);

    function applyCMU(arr, id) {
      for (ucr of arr) {
        if (ucr[1] == id) {
          let units = ucr[3];
          let totalamt = ucr[2];
          let claimed = ucr[4];
          let plusMU = claimed * 1.06;

          let p = document.createElement("p");

          if (totalamt > plusMU) {
            e.target.parentNode.appendChild(p);
            p.innerText = `The consultant has claimed a mark up rate higher than the maximum 6% available to C-coded items. Claimed: $${totalamt}, Allowed: $${plusMU.toFixed(
              2
            )}`;
          } else {
            e.target.parentNode.appendChild(p);
            p.innerText = `The consultant claimed costs within the eligible amount, $${totalamt} was claimed and $${plusMU.toFixed(
              2
            )} was eligible.`;
          }
        }
      }
    }
    applyCMU(cCodeArr, identifier);
  }
});

function handleT210(a) {
  if (a.length != 0) {
    let excavatorEl = document.createElement("p");
    excavatorEl.innerText =
      "T210 Code was claimed: Please review the T210 code to determine if it is eligible as claimed. Please provide processing instructions if necessary. ENR";
    excavatorsEl.appendChild(excavatorEl);
  }
}
// for (ucr of arr) {
//   if (ucr[1] == id) {
//     // "u4 is me", "u5 is claimed", "u3 is units", "u2 is totalamt"
//     let max = ucr[4];
//     let claimed = ucr[5];
//     console.log(claimed);
//     // let diff = max - claimed;
//     // console.log(diff);
//   }
// }

// function applyLSCA(arr, id) {
//   for (ucr of arr) {
//     if (ucr[1] == id) {
//       ucr.push(Number(inputVal));
//       console.log(ucr);
//     }
//   }
// }
// console.log(e.target.parentNode.parentNode);
// document
//       .querySelectorAll(".submit-lab")
//       .addEventListener("click", console.log("234"));
// let labSubmitBtn = document.querySelector(".submit-lab");
// evt.target.parentNode
// function createLabEls(la) {
//   let p = document.createElement("p");
//   for (stats of la) {
//     labsEl.appendChild(p);
//     p.innerHTML = `Code: ${stats[1]}, Price: $${stats[2]}, Qty: ${stats[3]}, LSCA.max: ${stats[4]} `;
//   }
// }

// let lscaFormula = function(ucr, claimedAmt) {
//   let diff = lscaPrices.price - claimedAmt;
//   for (ucr of labsArr) {
//     let elig = diff + lscaPrices.price;
//     if(claimedAmt > elig) {
//       return claimedAmt - elig;
//     }
//   }
// }

let lsca = [
  ["M2201", 20.3],
  ["M2202", 113.2],
  ["M2203", 80.7],
  ["M2204", 102],
  ["M2205", 92.6],
  ["M2206", 98.5],
  ["M2207", 156.5],
  ["M2208", 176.5],
  ["M2209", 156.5],
  ["M2210", 176.5],
  ["M2211", 103.8],
  ["M2212", 123.8],
  ["M2213", 263.9],
  ["M2214", 76.4],
  ["M2215A", 250.5],
  ["M2215B", 28.6],
  ["M2215C", 20.3],
  ["M2215D", 28.6],
  ["M2215E", 23.9],
  ["M2215F", 149.1],
  ["M2216", 82.7],
  ["M2217", 60],
  ["M2653", 684.2],
  ["M2656", 43.5],
  ["M2657", 17.5],
  ["M2220", 210],
  ["M2221", 231],
  ["M2222", 243.5],
  ["M2223", 212.8],
  ["M2224", 107.3],
  ["M2225", 182.4],
  ["M2230", 35.5],
  ["M2231", 198],
  ["M2232", 141.2],
  ["M2233", 178.5],
  ["M2234", 182.1],
  ["M2235", 192.4],
  ["M2236", 273.7],
  ["M2237", 237.8],
  ["M2238", 273.7],
  ["M2239", 293.7],
  ["M2240", 181.6],
  ["M2241", 201.6],
  ["M2242", 461.8],
  ["M2243", 133.6],
  ["M2244", 90],
  ["M2654", 1197.3],
  ["M2250", 40.5],
  ["M2251", 226.3],
  ["M2252", 161.4],
  ["M2253", 204],
  ["M2254", 205.3],
  ["M2255", 217],
  ["M2256", 312.9],
  ["M2257", 268.9],
  ["M2258", 312.9],
  ["M2259", 268.9],
  ["M2260", 207.5],
  ["M2261", 207.5],
  ["M2262", 527.7],
  ["M2263", 152.7],
  ["M2264", 120],
  ["M2655", 1368.5],
  ["T245", 48],
];
// function findLabs(arr) {
//   for (let i = 0; i <= arr.length; i++) {
//     if (arr[i] == "T245" ) {
//       return arr[i];
//     }
//   }
// }
// workbook.SheetNames.forEach((sheet) => {
//   let rowObject = XLSX.utils.sheet_to_row_object_array(
//     workbook.Sheets[sheet]
//   );
//   console.log(rowObject);
//   document.getElementById("jsondata").innerHTML = JSON.stringify(
//     rowObject,
//     undefined,
//     4
//   );
// });
