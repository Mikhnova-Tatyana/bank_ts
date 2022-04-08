"use strict";
class Client {
    constructor(data) {
        this.lastName = data.lastName;
        this.firstName = data.firstName;
        this.patronymic = data.patronymic;
        this.identificationNumber = data.identificationNumber;
        this.isActiveClient = data.isActiveClient;
        this.creditAccounts = data.creditAccounts;
        this.debitAccounts = data.debitAccounts;
        this.registrationDate = data.registrationDate;
    }
}
class FetchService {
    request(url) {
        return fetch(url).then((result) => result.json());
    }
}
class Bank {
    constructor(root) {
        this.root = root;
        this.clients = [];
        this.getCurses();
        let clients = localStorage.getItem("clients");
        if (clients !== null) {
            this.clients = JSON.parse(clients);
        }
    }
    clientListAction() {
        this.root.innerHTML = "";
        this.root.appendChild(this.createClientList());
    }
    createClientAction() {
        this.root.innerHTML = "";
        this.root.appendChild(this.createClientForm(null, 'create-client'));
    }
    createAccountAction() {
        this.root.innerHTML = "";
        this.root.appendChild(this.createSearchClientForm('account'));
    }
    editAction() {
        this.root.innerHTML = "";
        this.root.appendChild(this.createSearchClientForm('edit'));
    }
    countAction() {
        this.root.innerHTML = "";
        this.root.appendChild(this.createCalculationForm());
    }
    getCurses() {
        const fetchPost = new FetchService();
        fetchPost
            .request("https://api.privatbank.ua/p24api/pubinfo?exchange&json&coursid=11")
            .then((response) => {
            let uahCourse = { ccy: 'UAH', base_ccy: 'UAH', buy: '1.00', sale: '1.00' };
            response.push(uahCourse);
            localStorage.setItem('currancyCourse', JSON.stringify(response));
        })
            .catch(error => console.error(error));
    }
    createButton(type, className, text) {
        let button = document.createElement('button');
        button.type = type;
        button.classList.add(className);
        button.innerText = text;
        return button;
    }
    createInput(type, name, placeholder, value) {
        let input = document.createElement('input');
        input.type = type;
        input.name = name;
        input.placeholder = placeholder;
        input.value = value || " ";
        return input;
    }
    createTitle(type, text, className) {
        const title = document.createElement(type);
        title.innerText = text;
        title.classList.add(className);
        return title;
    }
    createSelect(name, options, values) {
        let select = document.createElement('select');
        select.name = name;
        options.forEach((option, index) => {
            select.options[index] = new Option(option, values[index]);
        });
        return select;
    }
    createClientList() {
        let table = document.createElement("table");
        table.className = 'table';
        for (let client of this.clients) {
            let tr = document.createElement("tr");
            for (let item in client) {
                let th = document.createElement("th");
                th.innerHTML = item;
                if (item === 'debitAccounts' || item === 'creditAccounts') {
                    let data = document.createElement("td");
                    for (let property of client[item]) {
                        let br = document.createElement("br");
                        for (let [key, value] of Object.entries(property)) {
                            let th = document.createElement("th");
                            let td = document.createElement("td");
                            th.innerHTML = key;
                            td.innerHTML = value;
                            data.append(th, td);
                        }
                        data.append(br);
                    }
                    tr.append(th, data);
                }
                else {
                    let th = document.createElement("th");
                    let td = document.createElement("td");
                    th.innerHTML = item;
                    td.innerHTML = client[item];
                    tr.append(th, td);
                }
            }
            table.append(tr);
        }
        return table;
    }
    createClientForm(clientData, className) {
        clientData = clientData || 0;
        let form = document.createElement('form');
        form.innerHTML = `
      <input type='text' placeholder = 'Введите фамилию' name = 'lastName' value=
        ${clientData.lastName || " "} >
      <input type='text' placeholder = 'Введите имя' name = 'firstName' value=
        ${clientData.firstName || " "} >
      <input type='text' placeholder = 'Введите отчество' name = 'patronymic' value=
        ${clientData.patronymic || " "} >
      <input type='number' placeholder ='Введите ИНН' name = 'identificationNumber' value=
        ${clientData.identificationNumber || " "} >
    `;
        let isActiveSelect = this.createSelect('isActiveClient', ['Выберите активность клиента', 'active', 'passive'], ['chose activity', true, false]);
        let buttonSubmit = this.createButton('button', 'btn', 'Отправить');
        buttonSubmit.addEventListener("click", this.onAddClient.bind(this));
        form.classList.add(className);
        form.append(isActiveSelect, buttonSubmit);
        return form;
    }
    onAddClient(event) {
        event.preventDefault();
        let data = new FormData(event.target.closest("form"));
        if (event.target.closest('form').classList.contains('update-client')) {
            let currentClient = JSON.parse(localStorage.getItem('currentClient'));
            data.forEach((value, name) => {
                Object.assign(currentClient, { [name]: value });
            });
            let index = Number(localStorage.getItem('currentClientIndex'));
            this.clients[index] = currentClient;
            localStorage.setItem("clients", JSON.stringify(this.clients));
            this.editAction();
        }
        else {
            let сlientData = {
                registrationDate: new Date().toLocaleDateString(),
                creditAccounts: [],
                debitAccounts: [],
                lastName: '',
                firstName: '',
                patronymic: '',
                identificationNumber: 0,
                isActiveClient: true,
            };
            data.forEach((value, name) => {
                Object.assign(сlientData, { [name]: value });
            });
            this.clients.push(сlientData);
            localStorage.setItem("clients", JSON.stringify(this.clients));
            this.createClientAction();
        }
    }
    createEditButtonGroup() {
        let buttonGroup = document.createElement("div");
        let updateButton = this.createButton("button", "options", "Редактировать");
        updateButton.addEventListener('click', this.onUpdateClient.bind(this));
        let deleteButton = this.createButton("button", "options", "Удалить");
        deleteButton.addEventListener('click', this.onDeleteClient.bind(this));
        buttonGroup.append(updateButton, deleteButton);
        buttonGroup.classList.add('button-group');
        return buttonGroup;
    }
    onUpdateClient(event) {
        event.preventDefault();
        if (this.root.querySelector(".update-client")) {
            this.root.querySelector(".update-client").remove();
        }
        let currentClient = JSON.parse(localStorage.getItem('currentClient'));
        this.root.appendChild(this.createClientForm(currentClient, 'update-client'));
    }
    onDeleteClient(event) {
        event.preventDefault();
        let index = Number(localStorage.getItem('currentClientIndex'));
        this.clients.splice(index, 1);
        localStorage.setItem("clients", JSON.stringify(this.clients));
        this.root.appendChild(this.createTitle('p', 'Клиент был удален', 'message'));
    }
    createSearchClientForm(className) {
        let form = document.createElement("form");
        let identificationNumberInput = this.createInput('number', 'identificationNumber', 'Введите ИНН клиента');
        let buttonSearchClient = this.createButton("button", "btn", "Найти");
        buttonSearchClient.addEventListener('click', this.onSearchClient.bind(this));
        buttonSearchClient.addEventListener('click', this.renderForm.bind(this));
        form.append(identificationNumberInput, buttonSearchClient);
        form.classList.add(className);
        return form;
    }
    onSearchClient(event) {
        event.preventDefault();
        let currentClient = this.clients.
            find(client => client.identificationNumber ===
            event.target.closest("form").identificationNumber.value);
        let currentClientIndex = this.clients.
            findIndex(client => client.identificationNumber ===
            event.target.closest("form").identificationNumber.value);
        if (this.root.querySelector(".message")) {
            this.root.querySelector(".message").remove();
        }
        if (this.root.querySelector(".table")) {
            this.root.querySelector(".table").remove();
        }
        if (this.root.querySelector(".title")) {
            this.root.querySelector(".title").remove();
        }
        if (this.root.querySelector(".input-group")) {
            this.root.querySelector(".input-group").remove();
        }
        if (this.root.querySelector(".button-group")) {
            this.root.querySelector(".button-group").remove();
        }
        if (this.root.querySelector(".debit-account")) {
            this.root.querySelector(".debit-account").remove();
        }
        if (this.root.querySelector(".credit-account")) {
            this.root.querySelector(".credit-account").remove();
        }
        if (this.root.querySelector(".update-client")) {
            this.root.querySelector(".update-client").remove();
        }
        if (!currentClient) {
            let message = this.createTitle('p', 'Клиент с данным ИНН не найден', 'message');
            this.root.appendChild(message);
            event.stopImmediatePropagation();
        }
        this.showClient(currentClient);
        localStorage.setItem('currentClient', JSON.stringify(currentClient));
        localStorage.setItem('currentClientIndex', JSON.stringify(currentClientIndex));
    }
    renderForm(event) {
        if (event.target.closest('form').className === 'account') {
            this.root.appendChild(this.createTitle('div', 'Какой счет Вы хотите открыть?', 'title'));
            this.root.appendChild(this.createRadioInputGroup('account', ['Дебитовый счет', 'Кредитовый счет']));
        }
        if (event.target.closest('form').className === 'edit') {
            this.root.appendChild(this.createTitle('div', 'Выберите действия над текущим клиентом', 'title'));
            this.root.appendChild(this.createEditButtonGroup());
        }
    }
    showClient(currentClient) {
        let table = document.createElement("table");
        table.className = 'table';
        let tr = document.createElement("tr");
        for (let item in currentClient) {
            if (item === 'creditAccounts' || item === 'debitAccounts') {
                let th = document.createElement("th");
                let td = document.createElement("td");
                th.innerHTML = item;
                td.innerHTML = String(currentClient[item].length);
                tr.append(th, td);
            }
            else {
                let th = document.createElement("th");
                let td = document.createElement("td");
                th.innerHTML = item;
                td.innerHTML = currentClient[item];
                tr.append(th, td);
            }
        }
        table.append(tr);
        this.root.append(table);
    }
    createRadioInputGroup(name, values) {
        let inputGroup = document.createElement("div");
        values.forEach((value, index) => {
            let temp = Date.now() + index;
            let radioInput = document.createElement('input');
            radioInput.type = 'radio';
            radioInput.name = name;
            radioInput.value = value;
            radioInput.id = temp.toString();
            let label = document.createElement('label');
            label.innerText = value;
            label.htmlFor = temp.toString();
            inputGroup.append(label, radioInput);
        });
        inputGroup.classList.add("input-group");
        inputGroup.addEventListener('change', this.renderAccount.bind(this, inputGroup));
        return inputGroup;
    }
    renderAccount(container, event) {
        if (event.target.name === "account") {
            event.preventDefault();
            if (this.root.querySelector(".debit-account")) {
                this.root.querySelector(".debit-account").remove();
            }
            if (this.root.querySelector(".credit-account")) {
                this.root.querySelector(".credit-account").remove();
            }
            if (event.target.value === 'Дебитовый счет') {
                let debitAccount = this.createDebitAccountForm();
                this.root.appendChild(debitAccount);
            }
            else if (event.target.value === 'Кредитовый счет') {
                let creditAccount = this.createCreditAccountForm();
                this.root.appendChild(creditAccount);
            }
        }
    }
    createDebitAccountForm() {
        let form = document.createElement("form");
        let balance = this.createInput('number', 'balance', 'Введите сумму личных средств');
        let isActiveSelect = this.createSelect("isActive", ['Выберите активность счета', 'active', 'passive'], ['chose activity', true, false]);
        let currencyTypeSelect = this.createSelect("currencyType", ['Выберите валюту', 'UAH', 'USD', 'EUR'], ['chose currancy', 'UAH', 'USD', 'EUR']);
        let buttonAddAccount = this.createButton("button", "btn", "Добавить счет");
        buttonAddAccount.addEventListener("click", this.onAddDebitAccount.bind(this));
        form.classList.add("debit-account");
        form.append(balance, isActiveSelect, currencyTypeSelect, buttonAddAccount);
        return form;
    }
    onAddDebitAccount(event) {
        event.preventDefault();
        let debitData = {
            activationDate: new Date().toLocaleDateString(),
            cardExpirationDate: new Date(new Date().
                setFullYear(new Date().getFullYear() + 5)).toLocaleDateString(),
            balance: 0,
            isActive: true,
            currencyType: 'UAH'
        };
        let data = new FormData(event.target.closest("form"));
        data.forEach((value, name) => {
            Object.assign(debitData, { [name]: value });
        });
        let currentClient = JSON.parse(localStorage.getItem('currentClient'));
        currentClient.debitAccounts.push(debitData);
        let index = Number(localStorage.getItem('currentClientIndex'));
        this.clients[index] = currentClient;
        localStorage.setItem("clients", JSON.stringify(this.clients));
        this.createAccountAction();
    }
    createCreditAccountForm() {
        let form = document.createElement("form");
        let personalFunds = this.createInput('number', 'personalFunds', 'Введите сумму личных средств');
        let limit = this.createInput('number', 'limit', 'Введите сумму кредитного лимита');
        let isActiveSelect = this.createSelect("isActive", ['Выберите активность счета', 'active', 'passive'], ['chose activity', true, false]);
        let currencyTypeSelect = this.createSelect("currencyType", ['Выберите валюту', 'UAH', 'USD', 'EUR'], ['chose currancy', 'UAH', 'USD', 'EUR']);
        let buttonAddAccount = this.createButton("button", "btn", "Добавить счет");
        buttonAddAccount.addEventListener("click", this.onAddCreditAccount.bind(this));
        form.classList.add("credit-account");
        form.append(personalFunds, limit, isActiveSelect, currencyTypeSelect, buttonAddAccount);
        return form;
    }
    onAddCreditAccount(event) {
        event.preventDefault();
        let creditData = {
            balance: Number(event.target.closest("form").personalFunds.value) +
                Number(event.target.closest("form").limit.value),
            activationDate: new Date().toLocaleDateString(),
            cardExpirationDate: new Date(new Date().
                setFullYear(new Date().getFullYear() + 5)).toLocaleDateString(),
        };
        let data = new FormData(event.target.closest("form"));
        data.forEach((value, name) => {
            Object.assign(creditData, { [name]: value });
        });
        let currentClient = JSON.parse(localStorage.getItem('currentClient'));
        currentClient.creditAccounts.push(creditData);
        let index = Number(localStorage.getItem('currentClientIndex'));
        this.clients[index] = currentClient;
        localStorage.setItem("clients", JSON.stringify(this.clients));
        this.createAccountAction();
    }
    countMoneyAmount(currencyType) {
        let moneyAmount = {};
        let client;
        for (client of this.clients) {
            for (let account of client.debitAccounts) {
                if (account) {
                    if (!moneyAmount[account.currencyType]) {
                        moneyAmount[account.currencyType] = 0;
                    }
                    moneyAmount[account.currencyType] += +account.balance;
                }
            }
            for (let account of client.creditAccounts) {
                if (account) {
                    if (!moneyAmount[account.currencyType]) {
                        moneyAmount[account.currencyType] = 0;
                    }
                    moneyAmount[account.currencyType] += account.balance;
                }
            }
        }
        let sumUah = 0;
        let rate;
        for (let currancy of JSON.parse(localStorage.currancyCourse)) {
            for (let item in moneyAmount) {
                if (currancy.ccy === item) {
                    sumUah += moneyAmount[currancy.ccy] * currancy.sale;
                }
                if (currancy.ccy === currencyType) {
                    rate = currancy.sale;
                }
            }
        }
        return sumUah / rate;
    }
    countCommonCreditMoney(currencyType) {
        let commonCreditMoney = {};
        for (let client of this.clients) {
            for (let account of client.creditAccounts) {
                if (account) {
                    if (!commonCreditMoney[account.currencyType]) {
                        commonCreditMoney[account.currencyType] = 0;
                    }
                    commonCreditMoney[account.currencyType] +=
                        account.balance - (+account.personalFunds);
                }
            }
        }
        let sumUah = 0;
        let rate;
        for (let currancy of JSON.parse(localStorage.currancyCourse)) {
            for (let item in commonCreditMoney) {
                if (currancy.ccy === item) {
                    sumUah += commonCreditMoney[currancy.ccy] * currancy.sale;
                }
                if (currancy.ccy === currencyType) {
                    rate = currancy.sale;
                }
            }
        }
        return sumUah / rate;
    }
    countCreditMoney(currencyType, isActive) {
        let creditMoney = {};
        for (let client of this.clients) {
            for (let account of client.creditAccounts) {
                if (account) {
                    if (!creditMoney[account.currencyType]) {
                        creditMoney[account.currencyType] = 0;
                    }
                    if (client.isActiveClient === isActive) {
                        creditMoney[account.currencyType] +=
                            account.balance - (+account.personalFunds);
                    }
                }
            }
        }
        let sumUah = 0;
        let rate;
        for (let currancy of JSON.parse(localStorage.currancyCourse)) {
            for (let item in creditMoney) {
                if (currancy.ccy === item) {
                    sumUah += creditMoney[currancy.ccy] * currancy.sale;
                }
                if (currancy.ccy === currencyType) {
                    rate = currancy.sale;
                }
            }
        }
        return sumUah / rate;
    }
    createCalculationForm() {
        let form = document.createElement('form');
        let operationSelect = this.createSelect('calculations', ['Выберите тип расчета', 'Общее количество денег внутри банка', 'Общие кредитные средства', 'Кредитные средства'], ['calculationType', 'countMoneyAmount', 'countCommonCreditMoney', 'countCreditMoney']);
        let currencyTypeSelect = this.createSelect("currencyType", ['Выберите валюту', 'UAH', 'USD', 'EUR'], ['currency', 'UAH', 'USD', 'EUR']);
        let isActiveClientSelect = this.createSelect("isActiveClient", ['clients', 'active', 'passive'], ['clients', true, false]);
        let buttonCalculate = this.createButton('button', 'btn', 'Рассчитать');
        let output = this.createTitle('p', '0.00', 'calculation-output');
        buttonCalculate.addEventListener('click', this.onCalculate.bind(this));
        form.append(operationSelect, currencyTypeSelect, isActiveClientSelect, buttonCalculate, output);
        return form;
    }
    onCalculate(event) {
        event.preventDefault();
        let operation = event.target.closest("form").calculations.value;
        let currencyType = event.target.closest("form").currencyType.value;
        let isActiveClient = event.target.closest("form").isActiveClient.value;
        let output = event.target.closest("form").querySelector('p');
        output.innerHTML = String(this[operation](currencyType, isActiveClient));
    }
}
class BankMenu {
    constructor(root) {
        this.root = root;
        this.navigations = [
            {
                title: "Список клиентов",
                isActive: false,
                action: "clientListAction",
            }, {
                title: "Добавить нового клиента",
                isActive: false,
                action: "createClientAction",
            }, {
                title: "Открыть счет",
                isActive: true,
                action: "createAccountAction",
            }, {
                title: "Редактирование",
                isActive: false,
                action: "editAction",
            }, {
                title: "Расчеты",
                isActive: false,
                action: "countAction",
            },
        ];
        this.render();
    }
    render() {
        this.root.innerHTML = "";
        let ul = document.createElement("ul");
        let div = document.createElement("div");
        this.container = new Bank(div);
        ul.addEventListener("click", this.onContainer.bind(this));
        ul.classList.add("menu");
        for (let i = 0; i < this.navigations.length; i++) {
            let li = document.createElement("li");
            li.setAttribute("data-action", this.navigations[i].action);
            if (this.navigations[i].isActive) {
                li.classList.add("active");
                if (typeof this.container[this.navigations[i].action] === "function") {
                    this.container[this.navigations[i].action]();
                }
            }
            ul.appendChild(li);
            let span = document.createElement("SPAN");
            span.innerHTML = this.navigations[i].title;
            li.appendChild(span);
        }
        this.root.append(ul);
        this.root.append(div);
    }
    onContainer(event) {
        let element = event.target.closest("li");
        if (element !== null && !element.classList.contains("active")) {
            event.preventDefault();
            let liActive = element.closest("ul").querySelector("li.active");
            liActive.classList.remove("active");
            element.classList.add("active");
            let action = element.getAttribute("data-action");
            if (typeof this.container[action] === "function") {
                this.container[action]();
            }
        }
    }
}
let root = document.getElementById("root");
let bank = new BankMenu(root);
