const WHATSAPP_NUMBER = "5565993307137";

const form = document.querySelector("#budgetForm");
const quantityInput = document.querySelector("#quantity");
const decreaseButton = document.querySelector("#decreaseQty");
const increaseButton = document.querySelector("#increaseQty");
const goToCustomerDataButton = document.querySelector("#goToCustomerData");
const backToBudgetButton = document.querySelector("#backToBudget");
const documentInput = document.querySelector("#document");
const phoneInput = document.querySelector("#phone");
const dateInput = document.querySelector("#date");
const timeInput = document.querySelector("#time");
const steps = document.querySelectorAll(".form-step");
const budgetError = document.querySelector("#budgetError");

const budgetSummary = document.querySelector("#budgetSummary");
const summaryService = document.querySelector("#summaryService");
const summaryKeg = document.querySelector("#summaryKeg");
const summaryQty = document.querySelector("#summaryQty");
const summaryLiters = document.querySelector("#summaryLiters");
const summaryVoltage = document.querySelector("#summaryVoltage");
const summaryTotal = document.querySelector("#summaryTotal");

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
  const service = selected("service");
  const keg = selected("keg");
  const voltage = selected("voltage");
  const quantity = getQuantity();

  if (!service || !keg) {
    return {
      service: service?.value || "",
      keg: keg?.value || "",
      cups: keg?.dataset.cups || "",
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
  const serviceExtra = Number(service.dataset.priceExtra);

  return {
    service: service.value,
    keg: keg.value,
    cups: keg.dataset.cups,
    voltage: voltage?.value || "",
    quantity,
    kegLiters,
    unitPrice,
    total: (unitPrice + serviceExtra) * quantity,
    isComplete: true,
  };
}

function setStep(stepNumber) {
  steps.forEach((step) => {
    step.classList.toggle("is-active", step.dataset.step === String(stepNumber));
  });

  document.querySelector("#orcamento").scrollIntoView({ behavior: "smooth", block: "start" });
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
      : "Digite um CPF com 11 digitos ou CNPJ com 14 digitos."
  );
}

function updateSummary() {
  const budget = getBudget();
  quantityInput.value = budget.quantity;

  budgetSummary.classList.toggle("is-empty", !budget.isComplete);
  summaryService.textContent = budget.service || "-";
  summaryKeg.textContent = budget.keg || "-";
  summaryQty.textContent = budget.isComplete
    ? `${budget.quantity} ${budget.quantity === 1 ? "barril" : "barris"}`
    : "-";
  summaryLiters.textContent = budget.isComplete
    ? `${budget.quantity * budget.kegLiters} litros`
    : "-";
  summaryVoltage.textContent = budget.voltage || "Obrigatorio no cadastro";
  summaryTotal.textContent = budget.isComplete ? moneyFormatter.format(budget.total) : "-";
}

function setBudgetError(message) {
  budgetError.textContent = message;
}

function validateBudgetStep() {
  const service = selected("service");
  const keg = selected("keg");

  if (!service && !keg) {
    setBudgetError("Escolha o tipo de servico e o tamanho do barril.");
    return false;
  }

  if (!service) {
    setBudgetError("Escolha o tipo de servico.");
    return false;
  }

  if (!keg) {
    setBudgetError("Escolha o tamanho do barril.");
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
    `Serviço: ${budget.service}`,
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

decreaseButton.addEventListener("click", () => changeQuantity(-1));
increaseButton.addEventListener("click", () => changeQuantity(1));

goToCustomerDataButton.addEventListener("click", () => {
  updateSummary();
  if (validateBudgetStep()) {
    setStep(2);
  }
});

backToBudgetButton.addEventListener("click", () => setStep(1));

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
    setStep(2);
    form.reportValidity();
    return;
  }

  const message = encodeURIComponent(buildWhatsAppMessage());
  window.open(`https://wa.me/${WHATSAPP_NUMBER}?text=${message}`, "_blank", "noopener");
});

const today = new Date();
today.setMinutes(today.getMinutes() - today.getTimezoneOffset());
dateInput.min = today.toISOString().slice(0, 10);
updateSummary();
