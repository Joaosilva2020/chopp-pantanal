const WHATSAPP_NUMBER = "5565993307137";

const form = document.querySelector("#budgetForm");
const quantityInput = document.querySelector("#quantity");
const decreaseButton = document.querySelector("#decreaseQty");
const increaseButton = document.querySelector("#increaseQty");
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

const budgetSummary = document.querySelector("#budgetSummary");
const summaryKeg = document.querySelector("#summaryKeg");
const summaryQty = document.querySelector("#summaryQty");
const summaryLiters = document.querySelector("#summaryLiters");
const summaryCups = document.querySelector("#summaryCups");
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

function getQuantity() {
  const parsed = Number.parseInt(quantityInput.value, 10);
  if (Number.isNaN(parsed) || parsed < 1) {
    return 1;
  }

  return Math.min(parsed, 20);
}

function getBudget() {
  const keg = selected("keg");
  const voltage = selected("voltage");
  const quantity = getQuantity();

  if (!keg) {
    return {
      keg: "",
      cups: 0,
      voltage: voltage?.value || "",
      quantity,
      kegLiters: 0,
      unitPrice: 0,
      total: 0,
      isComplete: false,
    };
  }

  const kegLiters = Number.parseInt(keg.value, 10);
  const unitPrice = Number(keg.dataset.price);

  return {
    keg: keg.value,
    cups: Number(keg.dataset.cups),
    voltage: voltage?.value || "",
    quantity,
    kegLiters,
    unitPrice,
    total: unitPrice * quantity,
    isComplete: true,
  };
}

function currentStep() {
  return form.dataset.step;
}

function setStep(stepNumber) {
  form.dataset.step = String(stepNumber);

  steps.forEach((step) => {
    step.classList.toggle("is-active", step.dataset.step === String(stepNumber));
  });

  barAction.textContent = stepNumber === 1 ? "Continuar" : "Enviar no WhatsApp";
  progress.scrollIntoView({ behavior: "smooth", block: "start" });
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

function updateSummary() {
  const budget = getBudget();
  quantityInput.value = budget.quantity;

  budgetSummary.classList.toggle("is-empty", !budget.isComplete);
  summaryKeg.textContent = budget.keg || "-";
  summaryQty.textContent = budget.isComplete
    ? `${budget.quantity} ${budget.quantity === 1 ? "barril" : "barris"}`
    : "-";
  summaryLiters.textContent = budget.isComplete
    ? `${budget.quantity * budget.kegLiters} litros`
    : "-";
  summaryCups.textContent = budget.isComplete
    ? `≈ ${budget.quantity * budget.cups} copos`
    : "-";
  summaryVoltage.textContent = budget.voltage || "Informe no cadastro";
  summaryTotal.textContent = budget.isComplete ? moneyFormatter.format(budget.total) : "-";

  if (budget.isComplete) {
    barLabel.textContent = `${budget.quantity} × ${budget.keg} · total estimado`;
    barTotal.textContent = moneyFormatter.format(budget.total);
  } else {
    barLabel.textContent = "Total estimado";
    barTotal.textContent = "Escolha um barril";
  }
}

function setBudgetError(message) {
  budgetError.textContent = message;
}

function validateBudgetStep() {
  if (!selected("keg")) {
    setBudgetError("Escolha o tamanho do barril para continuar.");
    return false;
  }

  setBudgetError("");
  return true;
}

function changeQuantity(amount) {
  quantityInput.value = getQuantity() + amount;
  updateSummary();
}

function buildWhatsAppMessage() {
  const budget = getBudget();
  const data = new FormData(form);
  const notes = data.get("notes")?.trim();

  return [
    "Olá, Pantanal Chopp! Quero fazer um pedido/orçamento.",
    "",
    "*Pedido*",
    "Produto: Cerveja Pantanal",
    `Barril: ${budget.keg}`,
    `Quantidade: ${budget.quantity} ${budget.quantity === 1 ? "barril" : "barris"}`,
    `Volume total: ${budget.quantity * budget.kegLiters} litros`,
    `Rendimento médio: ${budget.cups} copos de 300ml por barril`,
    `Valor unitário: ${moneyFormatter.format(budget.unitPrice)}`,
    `Total: ${moneyFormatter.format(budget.total)}`,
    "",
    "*Dados do cliente*",
    `Nome: ${data.get("name")}`,
    `CPF/CNPJ: ${data.get("document")}`,
    `WhatsApp: ${data.get("phone")}`,
    `Endereço: ${data.get("address")}`,
    `Data da entrega: ${formatDateForMessage(data.get("date"))}`,
    `Hora da entrega: ${data.get("time")}`,
    `Energia no local: ${budget.voltage}`,
    notes ? `Observações: ${notes}` : "",
  ]
    .filter(Boolean)
    .join("\n");
}

function tryGoToStepTwo() {
  updateSummary();

  if (validateBudgetStep()) {
    setStep(2);
    return;
  }

  kegPanel.scrollIntoView({ behavior: "smooth", block: "center" });
}

decreaseButton.addEventListener("click", () => changeQuantity(-1));
increaseButton.addEventListener("click", () => changeQuantity(1));

goToCustomerDataButton.addEventListener("click", tryGoToStepTwo);
backToBudgetButton.addEventListener("click", () => setStep(1));

// Barra fixa do celular: continua na etapa 1, envia na etapa 2
barAction.addEventListener("click", () => {
  if (currentStep() === "1") {
    tryGoToStepTwo();
  } else {
    submitButton.click();
  }
});

documentInput.addEventListener("input", () => {
  documentInput.value = formatCpfCnpj(documentInput.value);
  validateCustomerFields();
});

phoneInput.addEventListener("input", () => {
  phoneInput.value = formatPhone(phoneInput.value);
});

form.addEventListener("input", () => {
  setBudgetError("");
  updateSummary();
});

form.addEventListener("change", () => {
  setBudgetError("");
  updateSummary();
});

form.addEventListener("submit", (event) => {
  event.preventDefault();
  validateCustomerFields();

  if (!validateBudgetStep()) {
    setStep(1);
    return;
  }

  if (!form.checkValidity()) {
    if (currentStep() !== "2") setStep(2);
    form.reportValidity();
    return;
  }

  const url = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(buildWhatsAppMessage())}`;
  const popup = window.open(url, "_blank");

  if (popup) {
    popup.opener = null;
  } else {
    window.location.href = url;
  }
});

// Menu do celular
function setMenu(open) {
  mainNav.classList.toggle("is-open", open);
  menuToggle.setAttribute("aria-expanded", String(open));
  menuToggle.setAttribute("aria-label", open ? "Fechar menu" : "Abrir menu");
}

menuToggle.addEventListener("click", () => {
  setMenu(!mainNav.classList.contains("is-open"));
});

mainNav.addEventListener("click", (event) => {
  if (event.target.closest("a")) setMenu(false);
});

document.addEventListener("keydown", (event) => {
  if (event.key === "Escape") setMenu(false);
});

const today = new Date();
today.setMinutes(today.getMinutes() - today.getTimezoneOffset());
dateInput.min = today.toISOString().slice(0, 10);
updateSummary();
