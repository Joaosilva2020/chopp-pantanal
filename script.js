const WHATSAPP_NUMBER = "5565993307137";

const form = document.querySelector("#budgetForm");
const quantityInput = document.querySelector("#quantity");
const decreaseButton = document.querySelector("#decreaseQty");
const increaseButton = document.querySelector("#increaseQty");

const summaryService = document.querySelector("#summaryService");
const summaryKeg = document.querySelector("#summaryKeg");
const summaryQty = document.querySelector("#summaryQty");
const summaryVoltage = document.querySelector("#summaryVoltage");
const summaryTotal = document.querySelector("#summaryTotal");

const moneyFormatter = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL",
});

function selected(name) {
  return form.querySelector(`input[name="${name}"]:checked`);
}

function getQuantity() {
  const parsed = Number.parseInt(quantityInput.value, 10);
  if (Number.isNaN(parsed) || parsed < 1) {
    return 1;
  }

  return Math.min(parsed, 20);
}

function formatDateForMessage(value) {
  if (!value) return "";
  const [year, month, day] = value.split("-");
  return `${day}/${month}/${year}`;
}

function getBudget() {
  const service = selected("service");
  const keg = selected("keg");
  const voltage = selected("voltage");
  const quantity = getQuantity();
  const unitPrice = Number(keg.dataset.price);
  const serviceExtra = Number(service.dataset.priceExtra);
  const total = unitPrice > 0 ? (unitPrice + serviceExtra) * quantity : 0;

  return {
    service: service.value,
    keg: keg.value,
    cups: keg.dataset.cups,
    voltage: voltage.value,
    quantity,
    unitPrice,
    total,
  };
}

function updateSummary() {
  const budget = getBudget();

  quantityInput.value = budget.quantity;
  summaryService.textContent = budget.service;
  summaryKeg.textContent = budget.keg;
  summaryQty.textContent = `${budget.quantity} ${budget.quantity === 1 ? "barril" : "barris"}`;
  summaryVoltage.textContent = budget.voltage;
  summaryTotal.textContent = budget.total > 0 ? moneyFormatter.format(budget.total) : "Sob consulta";
}

function changeQuantity(amount) {
  quantityInput.value = getQuantity() + amount;
  updateSummary();
}

function buildWhatsAppMessage() {
  const budget = getBudget();
  const data = new FormData(form);
  const totalText = budget.total > 0 ? moneyFormatter.format(budget.total) : "Sob consulta";
  const unitText = budget.unitPrice > 0 ? moneyFormatter.format(budget.unitPrice) : "Sob consulta";
  const notes = data.get("notes")?.trim();

  return [
    "Olá, Pantanal Chopp! Quero fazer um pedido/orçamento.",
    "",
    "*Pedido*",
    `Serviço: ${budget.service}`,
    `Barril: ${budget.keg}`,
    `Quantidade: ${budget.quantity} ${budget.quantity === 1 ? "barril" : "barris"}`,
    `Rendimento médio: ${budget.cups} copos de 300ml por barril`,
    `Valor unitário: ${unitText}`,
    `Total estimado: ${totalText}`,
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

form.addEventListener("input", updateSummary);
form.addEventListener("change", updateSummary);

form.addEventListener("submit", (event) => {
  event.preventDefault();

  if (!form.reportValidity()) {
    return;
  }

  const message = encodeURIComponent(buildWhatsAppMessage());
  window.open(`https://wa.me/${WHATSAPP_NUMBER}?text=${message}`, "_blank", "noopener");
});

updateSummary();
