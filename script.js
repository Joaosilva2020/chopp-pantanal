const WHATSAPP_NUMBER = "556598091999";
const MAX_PER_KEG = 20;
const MIN_30L_FOR_CONSIGNADO = 2;

const getLocationButton = document.querySelector("#getLocationButton");
const locationStatus = document.querySelector("#locationStatus");
const addressInput = document.querySelector("#address");

let currentLocation = null;

const form = document.querySelector("#budgetForm");
const kegInputs = [...form.querySelectorAll("input[data-keg]")];
const goToCustomerDataButton = document.querySelector("#goToCustomerData");
const backToBudgetButton = document.querySelector("#backToBudget");
const submitButton = document.querySelector(".submit-button");
const documentInput = document.querySelector("#document");
const phoneInput = document.querySelector("#phone");
const dateInput = document.querySelector("#date");
const steps = document.querySelectorAll(".form-step");
const budgetError = document.querySelector("#budgetError");
const kegPanel = document.querySelector("#barris");
const progress = document.querySelector(".progress");
const consignPanel = document.querySelector("#consignPanel");
const consignInput = document.querySelector("#consignado");
const consignHint = document.querySelector("#consignHint");
const consignChoices = [...form.querySelectorAll('input[name="consignKeg"]')];
const consignError = document.querySelector("#consignError");

const budgetSummary = document.querySelector("#budgetSummary");
const summaryKeg = document.querySelector("#summaryKeg");
const summaryLiters = document.querySelector("#summaryLiters");
const summaryCups = document.querySelector("#summaryCups");
const summaryConsign = document.querySelector("#summaryConsign");
const summaryVoltage = document.querySelector("#summaryVoltage");
const summaryTotal = document.querySelector("#summaryTotal");

const barLabel = document.querySelector("#barLabel");
const barTotal = document.querySelector("#barTotal");
const barAction = document.querySelector("#barAction");

const menuToggle = document.querySelector("#menuToggle");
const mainNav = document.querySelector("#mainNav");

const moneyFormatter = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL",
});

function selected(name) {
  return form.querySelector(`input[name="${name}"]:checked`);
}

function onlyNumbers(value) {
  return value.replace(/\D/g, "");
}

function readQuantity(input) {
  const parsed = Number.parseInt(input.value, 10);

  if (Number.isNaN(parsed) || parsed < 0) {
    return 0;
  }

  return Math.min(parsed, MAX_PER_KEG);
}

function plural(count, singular, pluralWord) {
  return `${count} ${count === 1 ? singular : pluralWord}`;
}

function getBudget() {
  const voltage = selected("voltage");

  const items = kegInputs
    .map((input) => ({
      beer: input.dataset.beer,
      short: input.dataset.short,
      size: input.dataset.size,
      liters: Number(input.dataset.liters),
      cups: Number(input.dataset.cups),
      price: Number(input.dataset.price),
      qty: readQuantity(input),
    }))
    .filter((item) => item.qty > 0);

  const sumQty = (liters) =>
    items
      .filter((item) => item.liters === liters)
      .reduce((sum, item) => sum + item.qty, 0);

  const qty50 = sumQty(50);
  const qty30 = sumQty(30);

  const totalBarrels = items.reduce(
    (sum, item) => sum + item.qty,
    0
  );

  const totalLiters = items.reduce(
    (sum, item) => sum + item.qty * item.liters,
    0
  );

  const totalCups = items.reduce(
    (sum, item) => sum + item.qty * item.cups,
    0
  );

  const total = items.reduce(
    (sum, item) => sum + item.qty * item.price,
    0
  );

  const consignEligible =
    qty50 >= 1 || qty30 >= MIN_30L_FOR_CONSIGNADO;

  const consignado =
    consignEligible && consignInput.checked;

  const consignChoice =
    consignado ? selected("consignKeg") : null;

  return {
    items,
    qty50,
    qty30,
    totalBarrels,
    totalLiters,
    totalCups,
    total,
    voltage: voltage?.value || "",
    consignEligible,
    consignado,
    consignChoice: consignChoice
      ? {
          size: consignChoice.dataset.size,
          beer: consignChoice.dataset.beer,
          short: consignChoice.dataset.short,
        }
      : null,
    isComplete: totalBarrels > 0,
  };
}

function describeItems(items) {
  return items
    .map(
      (item) =>
        `${item.qty} × ${item.size} · ${item.short}`
    )
    .join("\n");
}

function currentStep() {
  return form.dataset.step;
}

function setStep(stepNumber) {
  form.dataset.step = String(stepNumber);

  steps.forEach((step) => {
    step.classList.toggle(
      "is-active",
      step.dataset.step === String(stepNumber)
    );
  });

  barAction.textContent =
    stepNumber === 1
      ? "Continuar"
      : "Enviar no WhatsApp";

  progress.scrollIntoView({
    behavior: "smooth",
    block: "start",
  });
}

function formatCpfCnpj(value) {
  const numbers = onlyNumbers(value).slice(0, 14);

  if (numbers.length <= 11) {
    return numbers
      .replace(/(\d{3})(\d)/, "$1.$2")
      .replace(/(\d{3})(\d)/, "$1.$2")
      .replace(/(\d{3})(\d{1,2})$/, "$1-$2");
  }

  return numbers
    .replace(/^(\d{2})(\d)/, "$1.$2")
    .replace(/^(\d{2})\.(\d{3})(\d)/, "$1.$2.$3")
    .replace(/\.(\d{3})(\d)/, ".$1/$2")
    .replace(/(\d{4})(\d{1,2})$/, "$1-$2");
}

function formatPhone(value) {
  const numbers = onlyNumbers(value).slice(0, 11);

  if (numbers.length <= 10) {
    return numbers
      .replace(/(\d{2})(\d)/, "($1) $2")
      .replace(/(\d{4})(\d)/, "$1-$2");
  }

  return numbers
    .replace(/(\d{2})(\d)/, "($1) $2")
    .replace(/(\d{5})(\d)/, "$1-$2");
}

function isValidCpfOrCnpj(value) {
  const length = onlyNumbers(value).length;
  return length === 11 || length === 14;
}

function formatDateForMessage(value) {
  if (!value) return "";

  const [year, month, day] = value.split("-");

  return `${day}/${month}/${year}`;
}

function validateCustomerFields() {
  documentInput.setCustomValidity(
    isValidCpfOrCnpj(documentInput.value)
      ? ""
      : "Digite um CPF com 11 dígitos ou CNPJ com 14 dígitos."
  );
}

function updateConsign(budget) {
  if (!budget.consignEligible) {
    consignInput.checked = false;
  }

  if (!consignInput.checked) {
    consignChoices.forEach((radio) => {
      radio.checked = false;
    });

    setConsignError("");
  }

  consignInput.disabled =
    !budget.consignEligible;

  consignPanel.classList.toggle(
    "is-locked",
    !budget.consignEligible
  );

  consignPanel.classList.toggle(
    "is-open",
    consignInput.checked
  );

  consignHint.textContent =
    budget.consignEligible
      ? "Disponível para este pedido."
      : "Disponível para barril de 50L ou a partir de 2 barris de 30L.";
}

function updateSummary() {
  updateConsign(getBudget());

  const budget = getBudget();

  kegInputs.forEach((input) => {
    input
      .closest(".keg-row")
      .classList.toggle(
        "is-selected",
        readQuantity(input) > 0
      );
  });

  budgetSummary.classList.toggle(
    "is-empty",
    !budget.isComplete
  );

  summaryKeg.textContent =
    budget.isComplete
      ? describeItems(budget.items)
      : "-";

  summaryLiters.textContent =
    budget.isComplete
      ? `${budget.totalLiters} litros`
      : "-";

  summaryCups.textContent =
    budget.isComplete
      ? `≈ ${budget.totalCups} copos`
      : "-";

  summaryConsign.textContent =
    budget.consignado
      ? budget.consignChoice
        ? `Sim · ${budget.consignChoice.size} ${budget.consignChoice.short}`
        : "Sim · escolha o barril"
      : "Não";

  summaryVoltage.textContent =
    budget.voltage || "Informe no cadastro";

  summaryTotal.textContent =
    budget.isComplete
      ? moneyFormatter.format(budget.total)
      : "-";

  if (budget.isComplete) {
    barLabel.textContent =
      `${plural(
        budget.totalBarrels,
        "barril",
        "barris"
      )} · ${budget.totalLiters}L · total estimado`;

    barTotal.textContent =
      moneyFormatter.format(budget.total);
  } else {
    barLabel.textContent = "Total estimado";
    barTotal.textContent = "Escolha um barril";
  }
}

function setBudgetError(message) {
  budgetError.textContent = message;
}

function setConsignError(message) {
  consignError.textContent = message;
}

function validateBudgetStep() {
  const budget = getBudget();

  if (!budget.isComplete) {
    setBudgetError(
      "Escolha pelo menos um barril para continuar."
    );

    return kegPanel;
  }

  setBudgetError("");

  if (
    budget.consignado &&
    !budget.consignChoice
  ) {
    setConsignError(
      "Escolha qual barril você quer no consignado."
    );

    return consignPanel;
  }

  setConsignError("");

  return null;
}

function changeQuantity(input, amount) {
  input.value = Math.max(
    0,
    Math.min(
      MAX_PER_KEG,
      readQuantity(input) + amount
    )
  );

  updateSummary();
}


/* =====================================================
   MENSAGEM DO WHATSAPP
===================================================== */

function buildWhatsAppMessage() {
  const budget = getBudget();
  const data = new FormData(form);
  const notes = data.get("notes")?.trim();

  const sizes = [
    ...new Set(
      budget.items.map((item) => item.size)
    ),
  ];

  const kegLine =
    sizes.length > 1
      ? sizes.join(" e ")
      : sizes[0];

  const itemLines = budget.items.map(
    (item) =>
      `*${item.qty} unidades - ${item.size} ${item.short}*`
  );

  const consignLine =
    budget.consignado &&
    budget.consignChoice
      ? `Consignado: ${budget.consignChoice.size}`
      : null;

  const locationLine =
    currentLocation
      ? `📍 *Localização atual:* https://www.google.com/maps?q=${currentLocation.latitude},${currentLocation.longitude}`
      : null;

  return [
    "Olá, Pantanal Chopp! Quero fazer um pedido",
    "",

    "*Pedido*",

    `Barril: ${kegLine}`,

    `Quantidade: ${plural(
      budget.totalBarrels,
      "barril",
      "barris"
    )}`,

    "*Chopp escolhido:*",

    ...itemLines,

    `Total de litros: ${budget.totalLiters} litros`,

    consignLine,

    `Total: ${moneyFormatter.format(
      budget.total
    )}`,

    "",

    "*Dados do cliente*",

    `Nome: ${data.get("name")}`,

    `CPF/CNPJ: ${data.get("document")}`,

    `WhatsApp: ${data.get("phone")}`,

    `Endereço: ${data.get("address")}`,

    `Data da entrega: ${formatDateForMessage(
      data.get("date")
    )}`,

    `Hora da entrega: ${data.get("time")}`,

    `Energia no local: ${budget.voltage}`,

    locationLine,

    notes
      ? `Observações: ${notes}`
      : null,
  ]
    .filter((line) => line !== null)
    .join("\n");
}


/* =====================================================
   LOCALIZAÇÃO ATUAL
===================================================== */

getLocationButton.addEventListener(
  "click",
  () => {
    if (!navigator.geolocation) {
      locationStatus.textContent =
        "Seu navegador não suporta localização.";

      return;
    }

    locationStatus.textContent =
      "Obtendo sua localização...";

    getLocationButton.disabled = true;

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const latitude =
          position.coords.latitude;

        const longitude =
          position.coords.longitude;

        currentLocation = {
          latitude,
          longitude,
        };

        /*
          Tenta transformar latitude/longitude
          em endereço.
        */

        try {
          const response = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${latitude}&lon=${longitude}&accept-language=pt-BR`
          );

          if (!response.ok) {
            throw new Error(
              "Não foi possível buscar o endereço."
            );
          }

          const result =
            await response.json();

          if (result.display_name) {
            addressInput.value =
              result.display_name;
          } else {
            addressInput.value =
              `Latitude: ${latitude}, Longitude: ${longitude}`;
          }
        } catch (error) {
          addressInput.value =
            `Latitude: ${latitude}, Longitude: ${longitude}`;
        }

        locationStatus.textContent =
          "✓ Endereço e localização obtidos com sucesso!";

        getLocationButton.disabled = false;
      },

      () => {
        locationStatus.textContent =
          "Não foi possível obter sua localização. Permita o acesso no navegador.";

        getLocationButton.disabled = false;
      },

      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0,
      }
    );
  }
);


/* =====================================================
   BOTÕES
===================================================== */

form.addEventListener(
  "click",
  (event) => {
    const button =
      event.target.closest(
        "button[data-target]"
      );

    if (!button) return;

    changeQuantity(
      document.getElementById(
        button.dataset.target
      ),
      Number(button.dataset.delta)
    );
  }
);


/* =====================================================
   QUANTIDADES
===================================================== */

kegInputs.forEach((input) => {
  input.addEventListener(
    "change",
    () => {
      input.value =
        readQuantity(input);

      updateSummary();
    }
  );
});


/* =====================================================
   ETAPAS
===================================================== */

goToCustomerDataButton.addEventListener(
  "click",
  tryGoToStepTwo
);

backToBudgetButton.addEventListener(
  "click",
  () => setStep(1)
);

function tryGoToStepTwo() {
  updateSummary();

  const problemPanel =
    validateBudgetStep();

  if (!problemPanel) {
    setStep(2);
    return;
  }

  problemPanel.scrollIntoView({
    behavior: "smooth",
    block: "center",
  });
}


/* =====================================================
   BARRA FIXA
===================================================== */

barAction.addEventListener(
  "click",
  () => {
    if (currentStep() === "1") {
      tryGoToStepTwo();
    } else {
      submitButton.click();
    }
  }
);


/* =====================================================
   CPF / CNPJ
===================================================== */

documentInput.addEventListener(
  "input",
  () => {
    documentInput.value =
      formatCpfCnpj(
        documentInput.value
      );

    validateCustomerFields();
  }
);


/* =====================================================
   TELEFONE
===================================================== */

phoneInput.addEventListener(
  "input",
  () => {
    phoneInput.value =
      formatPhone(
        phoneInput.value
      );
  }
);


/* =====================================================
   ATUALIZAÇÃO DO FORMULÁRIO
===================================================== */

form.addEventListener(
  "input",
  () => {
    setBudgetError("");
    setConsignError("");
    updateSummary();
  }
);

form.addEventListener(
  "change",
  () => {
    setBudgetError("");
    setConsignError("");
    updateSummary();
  }
);


/* =====================================================
   ENVIO PARA WHATSAPP
===================================================== */

form.addEventListener(
  "submit",
  (event) => {
    event.preventDefault();

    validateCustomerFields();

    if (validateBudgetStep()) {
      setStep(1);
      return;
    }

    if (!form.checkValidity()) {
      if (currentStep() !== "2") {
        setStep(2);
      }

      form.reportValidity();

      return;
    }

    const url =
      `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(
        buildWhatsAppMessage()
      )}`;

    const popup =
      window.open(
        url,
        "_blank"
      );

    if (popup) {
      popup.opener = null;
    } else {
      window.location.href = url;
    }
  }
);


/* =====================================================
   MENU DO CELULAR
===================================================== */

function setMenu(open) {
  mainNav.classList.toggle(
    "is-open",
    open
  );

  menuToggle.setAttribute(
    "aria-expanded",
    String(open)
  );

  menuToggle.setAttribute(
    "aria-label",
    open
      ? "Fechar menu"
      : "Abrir menu"
  );
}

menuToggle.addEventListener(
  "click",
  () => {
    setMenu(
      !mainNav.classList.contains(
        "is-open"
      )
    );
  }
);

mainNav.addEventListener(
  "click",
  (event) => {
    if (
      event.target.closest("a")
    ) {
      setMenu(false);
    }
  }
);

document.addEventListener(
  "keydown",
  (event) => {
    if (event.key === "Escape") {
      setMenu(false);
    }
  }
);


/* =====================================================
   CARROSSEL
===================================================== */

const SLIDE_INTERVAL = 2000;

const heroFigure =
  document.querySelector(
    "#heroFigure"
  );

const heroSlides = [
  ...heroFigure.querySelectorAll(
    ".hero-slide"
  ),
];

const heroDotsBox =
  document.querySelector(
    "#heroDots"
  );

const reduceMotion =
  window.matchMedia(
    "(prefers-reduced-motion: reduce)"
  );

let slideIndex = 0;
let slideTimer = null;

const heroDots =
  heroSlides.map(
    (_, index) => {
      const dot =
        document.createElement(
          "button"
        );

      dot.type = "button";
      dot.className =
        "hero-dot";

      dot.setAttribute(
        "aria-label",
        `Mostrar imagem ${
          index + 1
        } de ${
          heroSlides.length
        }`
      );

      dot.addEventListener(
        "click",
        () => {
          showSlide(index);
          startSlides();
        }
      );

      heroDotsBox.appendChild(
        dot
      );

      return dot;
    }
  );

function showSlide(index) {
  slideIndex =
    (index +
      heroSlides.length) %
    heroSlides.length;

  heroSlides.forEach(
    (slide, i) => {
      slide.classList.toggle(
        "is-active",
        i === slideIndex
      );

      slide.setAttribute(
        "aria-hidden",
        String(
          i !== slideIndex
        )
      );
    }
  );

  heroDots.forEach(
    (dot, i) => {
      dot.setAttribute(
        "aria-current",
        String(
          i === slideIndex
        )
      );
    }
  );
}

function stopSlides() {
  clearInterval(
    slideTimer
  );

  slideTimer = null;
}

function startSlides() {
  stopSlides();

  if (
    reduceMotion.matches ||
    heroSlides.length < 2
  ) {
    return;
  }

  slideTimer =
    setInterval(
      () =>
        showSlide(
          slideIndex + 1
        ),
      SLIDE_INTERVAL
    );
}

heroFigure.addEventListener(
  "mouseenter",
  stopSlides
);

heroFigure.addEventListener(
  "mouseleave",
  startSlides
);

document.addEventListener(
  "visibilitychange",
  () => {
    if (document.hidden) {
      stopSlides();
    } else {
      startSlides();
    }
  }
);


/* =====================================================
   DESLIZAR NO CELULAR
===================================================== */

let touchStartX = null;

heroFigure.addEventListener(
  "touchstart",
  (event) => {
    touchStartX =
      event.touches[0].clientX;
  },
  {
    passive: true,
  }
);

heroFigure.addEventListener(
  "touchend",
  (event) => {
    if (
      touchStartX === null
    ) {
      return;
    }

    const deltaX =
      event.changedTouches[0]
        .clientX -
      touchStartX;

    touchStartX = null;

    if (
      Math.abs(deltaX) > 40
    ) {
      showSlide(
        slideIndex +
          (deltaX < 0
            ? 1
            : -1)
      );

      startSlides();
    }
  }
);





showSlide(0);
startSlides();

const today = new Date();

today.setMinutes(
  today.getMinutes() -
    today.getTimezoneOffset()
);

dateInput.min =
  today.toISOString().slice(0, 10);

updateSummary();