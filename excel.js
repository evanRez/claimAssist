/* Working code should be refactored before 6/1/2021 */

/* global variables connected to DOM */
let labsEl = document.getElementById("labs");
let cCodesEl = document.getElementById("c_codes");
let xCodesEl = document.getElementById("x_codes");
let bCodesEl = document.getElementById("b_codes");
let excavatorsEl = document.getElementById("excavator");
let clearBtn = document.getElementById("clearBtn");
let uploadBtn = document.getElementById("uploadBtn");

/* array variables which will be the basis for functionality */
let selectedFile;
let labsArr = [];
let cCodeArr = [];
let xCodeArr = [];
let bCodeArr = [];
let t210Arr = [];

/* Listen to receive excel file, the inital and primary function */
document.getElementById("input").addEventListener("change", (event) => {
  selectedFile = event.target.files[0];
});

/* Parse the excel file to JSON & initialize on-screen data */
document.getElementById("uploadBtn").addEventListener("click", () => {
  /*File reader events were borrowed and reformatted */
  if (selectedFile) {
    let fileReader = new FileReader();
    fileReader.readAsBinaryString(selectedFile);
    fileReader.onload = (event) => {
      let data = event.target.result;
      let workbook = XLSX.read(data, { type: "binary" });
      /*these column variable are specific to how eAAF is formatted, currently not checking format, which could break the application */
      let costWorksheet = workbook.Sheets["AAF Cost Worksheet"];
      let aCol = [];
      let dCol = [];
      let iCol = [];

      /* extropolate the intended line items */
      for (let val in costWorksheet) {
        let letter = val.charAt(0);
        let number = val.slice(1);

        if (letter == "A" && Number(number) > 8) {
          aCol.push([Number(number), costWorksheet[val].v]);
        }
        if (letter == "D" && Number(number) > 8) {
          dCol.push([Number(number), costWorksheet[val].v]);
        }
        if (letter == "I" && Number(number) > 8) {
          iCol.push([Number(number), costWorksheet[val].v]);
        }
      }
      /* populate the working arrays with data and append to DOM */
      findLabs(aCol);
      addPrices(labsArr, iCol);
      addPrices(labsArr, dCol);
      addLSCA(labsArr, lsca);

      findCcodes(aCol);
      addPrices(cCodeArr, iCol);
      addPrices(cCodeArr, dCol);

      createLabEls(labsArr);
      createCcodesEls(cCodeArr);
      findT210(aCol);
      handleT210(t210Arr);

      if (clearBtn.classList.contains("hidden")) {
        clearBtn.classList.remove("hidden");
      }
      uploadBtn.classList.add("hidden");
    };
  }
});

/* Self explainging functions that manipulate data, potential to combine and refactor */
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

/*creating both lab & c-code DOM elements could be combined into a single function */

function createCcodesEls(ca) {
  cCodeHeader = document.createElement("h2");
  cCodeHeader.innerText = "'C' Coded Items";
  cCodesEl.appendChild(cCodeHeader);
  if (ca.length > 0) {
    ca.forEach((el) => {
      cCodeEl = document.createElement("DIV");
      cCodeEl.innerHTML = `
    <div class="${el[1]}">
    <article class="lab-card mb-3 border border-5 rounded-3 py-1 my-1 pl-1">
    <div class="row mb-3">
    <div class="col-6"> ${el[1]} </div>
    <div class="col-3"> Total Claimed: $${el[2]} </div>
    <div class="col-3"> Units: ${el[3]} </div>
    </div>
    <input type="text" class="c-input" placeholder="invoiced unit price"></input>
    <button id="submit-c" class="mb-3 subbut btn-sm">Submit</button>
        </article>
        </div>`;
      cCodesEl.appendChild(cCodeEl);
    });
  } else {
    cCodeEl = document.createElement("DIV");
    cCodeEl.innerHTML = `
    <div>No 'C' coded line items were detected</div>`;
    cCodesEl.appendChild(cCodeEl);
  }
}

function createLabEls(la) {
  labHeader = document.createElement("h2");
  labHeader.innerText = "Lab & Soil";
  labsEl.appendChild(labHeader);
  if (la.length > 0) {
    la.forEach((el) => {
      labEl = document.createElement("DIV");
      labEl.innerHTML = `
    <div class="${el[1]}">
    <article class="lab-card mb-3 border border-5 rounded-3 py-1 my-1 pl-1">
    <div class="row mb-3">
    <div class="col-6"> ${el[1]} </div>
    <div class="col-3"> Total Claimed: $${el[2]} </div>
    <div class="col-3"> Units: ${el[3]} </div>
    </div>
    <input type="text" class="lab-input" placeholder="invoiced unit price"></input>
    <button id="submit-lab" class="mb-3 subbut btn-sm ">Submit</button>
        </article>
        </div>
`;
      labsEl.appendChild(labEl);
    });
  } else {
    labEl = document.createElement("DIV");
    labEl.innerHTML = `
    <div>No Lab or Soil items were detected</div>`;
    labsEl.appendChild(labEl);
  }
}

/*add calculation factors and apply the LSCA & Mark up rate as needed, Both calculation could late be combined into a single function */
labsEl.addEventListener("click", function (e) {
  if (e.target && e.target.id == "submit-lab") {
    let inputVal = Number(e.target.parentNode.children[1].value);
    console.log(inputVal);

    let identifier = e.target.parentNode.parentNode.className;
    console.log(identifier);

    if (isNaN(inputVal)) {
      alert(`The unit rate must be a number. Please try again.`);
      return;
    }

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

          if (totalamt > elig * units) {
            e.target.parentNode.appendChild(p);
            p.innerText = `
            A Savings Pass Along review was performed and it was determined that costs in the amount of $${(
              totalamt - eligTotal
            ).toFixed(2)} will be denied D146.

            Costs were claimed in the amount of $${claimed} for ${units} samples of ${
              ucr[1]
            }; however the maximum reimbursable amount based on the ${
              ucr[1]
            } Savings Pass Along is $${eligTotal}. Therefore $${(
              totalamt - eligTotal
            ).toFixed(2)} should be denied.
            `;
            e.target.parentNode.classList.add("border-danger");
          } else {
            e.target.parentNode.appendChild(p);
            p.innerText = `The consultant correctly applied the LSCA. $${totalamt} was claimed and $${eligTotal.toFixed(
              2
            )} is eligible for reimbursement.`;
            e.target.parentNode.classList.add("border-success");
          }
        }
      }
    }
    applyLSCA(labsArr, identifier);
    e.target.disabled = true;
  }
});

cCodesEl.addEventListener("click", function (e) {
  if (e.target && e.target.id == "submit-c") {
    let inputVal = Number(e.target.parentNode.children[1].value);
    console.log(inputVal);

    let identifier = e.target.parentNode.parentNode.className;
    console.log(identifier);

    if (isNaN(inputVal)) {
      alert(`The unit rate must be a number. Please try again.`);
      return;
    }

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
            p.innerText = `The consultant is claiming a mark up rate in excess 6% for ${
              ucr[1]
            }. Reimbursement costs in the amount of $${(
              totalamt - plusMU
            ).toFixed(2)} will be denied D28.`;
            e.target.parentNode.classList.add("border-danger");
          } else {
            e.target.parentNode.appendChild(p);
            p.innerText = `The consultant claimed costs within the eligible amount, $${totalamt} was claimed and $${plusMU.toFixed(
              2
            )} was eligible.`;
            e.target.parentNode.classList.add("border-success");
          }
          p.classList.add("my-1");
        }
      }
    }
    applyCMU(cCodeArr, identifier);
    e.target.disabled = true;
  }
});

function handleT210(a) {
  if (a.length != 0) {
    let excavatorEl = document.createElement("DIV");
    excavatorEl.innerHTML = `
    <div class="T210">
    <h2>T210 Code</h2>
    <article class="lab-card mb-3 border border-5 rounded-3 py-1 my-1 pl-1">
    <div class="mb-3">CPAR to the Remediation/Reimbursement Program Technical Specialist</div>
    <div>Please review the T210 code to determine if it is eligible as claimed. Please provide processing instructions if necessary.</div>
    </div>`;
    excavatorsEl.appendChild(excavatorEl);
  }
}

function clearResults() {
  const l = document.querySelector("#labs");
  const c = document.querySelector("#c_codes");
  const x = document.querySelector("#x_codes");
  const b = document.querySelector("#b_codes");
  const e = document.querySelector("#excavator");

  labsArr = [];
  cCodeArr = [];
  xCodeArr = [];
  bCodeArr = [];
  t210Arr = [];
  aCol = [];
  dCol = [];
  iCol = [];

  let dataArr = [l, c, x, b, e];
  document.getElementById("input").value = null;

  dataArr.forEach((el) => {
    let child = el.lastElementChild;
    while (child) {
      el.removeChild(child);
      child = el.lastElementChild;
    }

    uploadBtn.classList.remove("hidden");
    clearBtn.classList.add("hidden");
  });
}

clearBtn.addEventListener("click", clearResults);

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
