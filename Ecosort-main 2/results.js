showOverlay();

let rawData = null;
const OPENAI_API_KEY = 'PARSE_YOUR_OPENAI_API_KEY_HERE';
const imgStr = localStorage.getItem('img');
let requestData = {
  model: "gpt-4o-mini",
  messages: [
    {
      role: "user",
      content: [
        {
          type: "text",
          text: "Analyze this image to determine if it contains any waste such as Plastic(single - use plastics, bottles, packaging, microplastics), Metal(aluminum cans, scrap metal, electronic waste), Glass(bottles, window panes, broken glass), Paper and Cardboard(newspapers, magazines, office paper, cardboard boxes), Organic / Biodegradable Waste(food waste, yard waste, agricultural waste, wood waste), Textile(clothing, fabric scraps, carpets, industrial textile waste),Electronic Waste(smartphones, computers, household electronics, batteries, wiring),Chemical and Hazardous Waste(cleaning agents, pesticides, paints, medical waste),Construction and Demolition Waste(concrete, bricks, tiles, roofing materials, plumbing and electrical),Rubber(tires, inner tubes, industrial rubber waste),Biomedical Waste(surgical instruments, syringes, contaminated bandages, pathological waste), Radioactive Waste(nuclear power plant waste, medical radioactive materials, industrial sources),Miscellaneous(ashes from combustion, bulky waste like furniture and mattresses, used tires). If waste is present, output only one the waste category (Plastic Waste (Recyclable); Metal Waste (Recyclable); Glass Waste (Recyclable, odourless); Paper and Cardboard Waste (Recyclable, odourless); Organic/Biodegradable Waste (Organic); Textile Waste (Recyclable); Electronic Waste (Hazardous); Chemical and Hazardous Waste (Hazardous); Construction and Demolition Waste (Recyclable, odourless); Rubber Waste (Recyclable); Biomedical Waste (Hazardous); Radioactive Waste (Hazardous); Miscellaneous Waste (Other). Note: Use this Output format: {Waste Category} Eco-friendly tip: {Eco-friendly tip} Kg:{How many kg likely will it be}"
        },
        {
          type: "image_url",
          image_url: {
            url: `data:image/jpeg;base64,${imgStr}`
          }
        }
      ]
    }
  ]
};

(async () => {
  localStorage.setItem('img', '');
  //console.log('Processing')
  await promptGpt();
  // Call the function to get user location data
  const location = await getUserLocation();

  if (rawData !== null && rawData !== undefined) {
    const wasteInfo = extractWasteInfo(rawData.choices[0].message.content);
    console.log(rawData);

    populate_data(wasteInfo.wasteCategory, wasteInfo.ecoTip);

    addPoint(10, wasteInfo.kg);
    updateAnalysisDB(location.Country, wasteInfo.kg);
    removeOverlay();
  }
})();

function promptGpt() {
  return new Promise((resolve, reject) => {
    // Send the POST request to GPT-4 Vision API (replace with your actual URL and API key)
    fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${OPENAI_API_KEY}`,
        },
        body: JSON.stringify(requestData),
      })
      .then(response => response.json())
      .then(data => {
        rawData = data;
        resolve();
      })
      .catch(error => {
        rawData = error;
        reject();
      });
  });
}

function extractWasteInfo(content) {
  // Use regex to extract the category (recyclable value inside parentheses or brackets)
  const regex = /\((.*?)\)/;
  const categoryMatch = content.match(regex); // Matches content inside parentheses or brackets

  // Use regex to extract the eco-friendly tip after the "Eco-friendly tip:" phrase
  const ecoTipMatch = content.match(/Eco-friendly tip:\s*([\s\S]*?)(?=\s*Kg:)/); // Matches the eco-friendly tip

  // Extract Kg value using regular expression
  const kgMatch = content.match(/Kg:\s*([\d.]+)/);

  return {
    wasteCategory: categoryMatch ? categoryMatch[1].trim() : "Category not found", // Extracts recyclable category
    ecoTip: ecoTipMatch ? ecoTipMatch[1].trim() : "Eco-tip not found", // Extracts eco-tip
    kg: kgMatch ? kgMatch[1].trim() : 0
  };
}

function showOverlay() {
  // Tab to edit
  document.getElementById('loadingOverlay').style.display = 'flex';
}

function removeOverlay() {
  // Tab to edit
  document.getElementById('loadingOverlay').style.display = 'none';
}

function addPoint(point, kg) {
  let previous_point = parseInt(localStorage.getItem('point'), 10) || 0;
  let previous_kg = parseFloat(localStorage.getItem('kg')) || 0.0;

  const total_point = previous_point + point;
  let total_kg = parseFloat(kg) + previous_kg;
  total_kg = parseFloat(total_kg).toFixed(2);
  localStorage.setItem('point', total_point.toString());
  localStorage.setItem('kg', total_kg.toString());
}

function getUserLocation() {
  return new Promise(async (resolve, reject) => {
    try {
      // Fetch data from ipapi.co, which doesn’t require an API key
      const response = await fetch('https://ipapi.co/json/');

      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }

      const data = await response.json();

      // Extract IP and country information
      const ip = data.ip;
      const country = data.country_name;

      console.log("IP Address:", ip);
      console.log("Country:", country);

      resolve({ IP: ip, Country: country });
    } catch (error) {
      console.error("Error fetching IP and location data:", error);
      reject();
    }
  });
}

function populate_data(wasteCategory, wasteInfo) {
  // Tab to edit
  document.getElementById('classificationResult').innerText = wasteCategory;
  document.getElementById('ecoTip').textContent = wasteInfo;
  document.getElementById('earnedPoints').textContent = '10';
}



function updateAnalysisDB(country_name, Kg) {
  return new Promise((resolve, reject) => {
    const reference = ref(db, 'EcoSort/Countries');
    runTransaction(reference, (data) => {
        if (!data) {
          data = {};
        }
        if (data[country_name]) {
          const kg = parseFloat(Kg).toFixed(2);
          data[country_name].kg = data[country_name].kg + parseFloat(kg);
        } else {
          const kg = parseFloat(Kg).toFixed(2);
          data[country_name] = {
            name: country_name,
            kg: parseFloat(kg)
          };
        }
        return data;
      })
      .then((result) => {
        resolve();
      })
      .catch((error) => {
        reject();
      });
  });
}