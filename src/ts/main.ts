interface IClient {
  lastName: string;
  firstName: string;
  patronymic: string;
  identificationNumber: number;
  isActiveClient: boolean;
  creditAccounts: ICreditAccount[];
  debitAccounts: IDebetAccount[];
  registrationDate: string;
}

class Client implements IClient {
  lastName: string;
  firstName: string;
  patronymic: string;
  identificationNumber: number;
  isActiveClient: boolean;
  creditAccounts: ICreditAccount[];
  debitAccounts: IDebetAccount[];
  registrationDate: string;
 
  constructor(data: IClient) {
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

interface IDebetAccount {
  balance: number;
  isActive: boolean;
  currencyType: string;
  activationDate: string;
  cardExpirationDate: string;
}

interface ICreditAccount extends IDebetAccount {
  personalFunds: number;
  limit: number;
}

interface INavigation {
  title: string;
  isActive: boolean;
  action: string;
}

type ISelect = string[] | [string, ...boolean[]];

interface IMoneyObject<T> {
  [key: string | symbol]: T
}

interface Connection<T> {
  request(url: string): Promise<T>
}

class FetchService<P> implements Connection<P> {
  request(url: string): Promise<P> {
    return fetch(url).then((result) => result.json());
  }
}

interface Currancy {
  ccy: string,
  base_ccy: string,
  buy: string,
  sale: string
}

class Bank {
  root: HTMLElement;
  clients: Client[];

  constructor(root: HTMLElement) {
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

  getCurses(): void {
    const fetchPost = new FetchService<Currancy[]>();
    fetchPost
      .request("https://api.privatbank.ua/p24api/pubinfo?exchange&json&coursid=11")
      .then((response: Currancy[]) => {
              let uahCourse: Currancy = { ccy: 'UAH', base_ccy: 'UAH', buy: '1.00', sale: '1.00' };
              response.push(uahCourse);
              localStorage.setItem('currancyCourse', JSON.stringify(response));
            })
            .catch(error => console.error(error));
  }

  createButton(type: string, className: string, text: string): HTMLButtonElement {
    let button: HTMLButtonElement = document.createElement('button');
    button.type = type;
    button.classList.add(className);
    button.innerText = text;
    return button;
  }

  createInput(type: string, name: string, placeholder: string, value?: string): HTMLInputElement {
    let input: HTMLInputElement = document.createElement('input');
    input.type = type;
    input.name = name;
    input.placeholder = placeholder;
    input.value = value || " ";
    return input;
  }

  createTitle(type: string, text: string, className: string): HTMLElement {
    const title: HTMLElement = document.createElement(type);
    title.innerText = text;
    title.classList.add(className);
    return title;
  }

  createSelect(name: string, options: string[], values: ISelect): HTMLSelectElement {
    let select: HTMLSelectElement = document.createElement('select');
    select.name = name;
    options.forEach((option: string, index: number) => {
      select.options[index] = new Option(option, (values[index] as string));
    });
    return select;
  }

  createClientList(): HTMLTableElement {
    let table: HTMLTableElement = document.createElement("table");
    table.className = 'table';
    let client: Client;
    for (client of this.clients) {
      let tr: HTMLTableRowElement = document.createElement("tr");
      let item: string;
      for (item in client) {
        let th: HTMLTableCellElement = document.createElement("th");
        th.innerHTML = item;
        if (item === 'debitAccounts' || item === 'creditAccounts') {
          let data: HTMLTableCellElement = document.createElement("td");
          let property: IDebetAccount | ICreditAccount;
          for (property of client[item]) {
            let br: HTMLBRElement = document.createElement("br");
            let key: string, value: number | boolean | string;
            for ([key, value] of Object.entries(property)) {
              let th: HTMLTableCellElement = document.createElement("th");
              let td: HTMLTableCellElement = document.createElement("td");
              th.innerHTML = key;
              td.innerHTML = value.toString();
              data.append(th, td);
            }
            data.append(br);
          }
          tr.append(th, data);
        } else {
          let th: HTMLTableCellElement = document.createElement("th");
          let td: HTMLTableCellElement = document.createElement("td");
          th.innerHTML = item;
          td.innerHTML = client[item as 'lastName' | 'firstName' | 'patronymic' |
            'identificationNumber' | 'isActiveClient' | 'registrationDate'] as string;
          tr.append(th, td);
        }
      }
      table.append(tr);
    }
    return table;
  }

  createClientForm(clientData: Client | null | 0, className: string): HTMLFormElement {
    clientData = clientData || 0;
    let form: HTMLFormElement = document.createElement('form');
    form.innerHTML = `
      <input type='text' placeholder = 'Введите фамилию' name = 'lastName' value=
        ${(clientData as Client).lastName || " "} >
      <input type='text' placeholder = 'Введите имя' name = 'firstName' value=
        ${(clientData as Client).firstName || " "} >
      <input type='text' placeholder = 'Введите отчество' name = 'patronymic' value=
        ${(clientData as Client).patronymic || " "} >
      <input type='number' placeholder ='Введите ИНН' name = 'identificationNumber' value=
        ${(clientData as Client).identificationNumber || " "} >
    `;
    let isActiveSelect: HTMLSelectElement = this.createSelect('isActiveClient',
      ['Выберите активность клиента', 'active', 'passive'],
      ['chose activity', true, false]);
    let buttonSubmit: HTMLButtonElement = this.createButton('button', 'btn', 'Отправить');
    buttonSubmit.addEventListener("click", this.onAddClient.bind(this));
    form.classList.add(className);
    form.append(isActiveSelect, buttonSubmit);
    return form;
  }

  onAddClient(event: MouseEvent): void {
    event.preventDefault();
    let data: FormData = new FormData((event.target as HTMLFormElement).closest("form")!);
    if ((event.target as HTMLFormElement).closest('form')!.classList.contains('update-client')) {
      let currentClient: Client = JSON.parse(localStorage.getItem('currentClient')!);
      data.forEach((value: FormDataEntryValue, name: string) => {
        Object.assign(currentClient, { [name]: value });
      });
      let index: number = Number(localStorage.getItem('currentClientIndex'));
      this.clients[index] = currentClient;
      localStorage.setItem("clients", JSON.stringify(this.clients));
      this.editAction();
    } else {
      let сlientData: Client = {
        registrationDate: new Date().toLocaleDateString(),
        creditAccounts: [],
        debitAccounts: [],
        lastName: '',
        firstName: '',
        patronymic: '',
        identificationNumber: 0,
        isActiveClient: true,
      };
      data.forEach((value: FormDataEntryValue, name: string) => {
        Object.assign(сlientData, { [name]: value });
      });
      this.clients.push(сlientData);
      localStorage.setItem("clients", JSON.stringify(this.clients));
      this.createClientAction();
    }
  }

  createEditButtonGroup(): HTMLDivElement {
    let buttonGroup: HTMLDivElement = document.createElement("div");
    let updateButton: HTMLButtonElement = this.createButton("button", "options", "Редактировать");
    updateButton.addEventListener('click', this.onUpdateClient.bind(this));
    let deleteButton: HTMLButtonElement = this.createButton("button", "options", "Удалить");
    deleteButton.addEventListener('click', this.onDeleteClient.bind(this));
    buttonGroup.append(updateButton, deleteButton);
    buttonGroup.classList.add('button-group');
    return buttonGroup;
  }

  onUpdateClient(event: MouseEvent): void {
    event.preventDefault();
    if (this.root.querySelector(".update-client")) {
      this.root.querySelector(".update-client")!.remove();
    }
    let currentClient: Client = JSON.parse(localStorage.getItem('currentClient')!);
    this.root.appendChild(this.createClientForm(currentClient, 'update-client'));
  }

  onDeleteClient(event: MouseEvent): void {
    event.preventDefault();
    let index = Number(localStorage.getItem('currentClientIndex'));
    this.clients.splice(index, 1);
    localStorage.setItem("clients", JSON.stringify(this.clients));
    this.root.appendChild(this.createTitle('p', 'Клиент был удален', 'message'));
  }

  createSearchClientForm(className: string): HTMLFormElement {
    let form: HTMLFormElement = document.createElement("form");
    let identificationNumberInput: HTMLInputElement = this.createInput('number',
      'identificationNumber', 'Введите ИНН клиента');
    let buttonSearchClient: HTMLButtonElement = this.createButton("button", "btn", "Найти");
    buttonSearchClient.addEventListener('click', this.onSearchClient.bind(this));
    buttonSearchClient.addEventListener('click', this.renderForm.bind(this));
    form.append(identificationNumberInput, buttonSearchClient);
    form.classList.add(className);
    return form;
  }

  onSearchClient(event: MouseEvent): void {
    event.preventDefault();
    let currentClient: Client | undefined = this.clients.
      find(client => client.identificationNumber ===
        (event.target as HTMLFormElement).closest("form")!.identificationNumber.value);

    let currentClientIndex: number = this.clients.
      findIndex(client => client.identificationNumber ===
        (event.target as HTMLFormElement).closest("form")!.identificationNumber.value);

    if (this.root.querySelector(".message")) {
      this.root.querySelector(".message")!.remove();
    }
    if (this.root.querySelector(".table")) {
      this.root.querySelector(".table")!.remove();
    }
    if (this.root.querySelector(".title")) {
      this.root.querySelector(".title")!.remove();
    }
    if (this.root.querySelector(".input-group")) {
      this.root.querySelector(".input-group")!.remove();
    }
    if (this.root.querySelector(".button-group")) {
      this.root.querySelector(".button-group")!.remove();
    }
    if (this.root.querySelector(".debit-account")) {
      this.root.querySelector(".debit-account")!.remove();
    }
    if (this.root.querySelector(".credit-account")) {
      this.root.querySelector(".credit-account")!.remove();
    }
    if (this.root.querySelector(".update-client")) {
      this.root.querySelector(".update-client")!.remove();
    }
    if (!currentClient) {
      let message: HTMLElement = this.createTitle('p', 'Клиент с данным ИНН не найден', 'message');
      this.root.appendChild(message);
      event.stopImmediatePropagation();
    }
    this.showClient(currentClient as Client);
    localStorage.setItem('currentClient', JSON.stringify(currentClient));
    localStorage.setItem('currentClientIndex', JSON.stringify(currentClientIndex));
  }

  renderForm(event: MouseEvent): void {
    if ((event.target as HTMLFormElement).closest('form')!.className === 'account') {
      this.root.appendChild(this.createTitle('div',
        'Какой счет Вы хотите открыть?', 'title'));
      this.root.appendChild(this.createRadioInputGroup('account',
        ['Дебитовый счет', 'Кредитовый счет']));
    }
    if ((event.target as HTMLFormElement).closest('form')!.className === 'edit') {
      this.root.appendChild(this.createTitle('div',
        'Выберите действия над текущим клиентом', 'title'));
      this.root.appendChild(this.createEditButtonGroup());
    }
  }

  showClient(currentClient: Client): void {
    let table: HTMLTableElement = document.createElement("table");
    table.className = 'table';
    let tr: HTMLTableRowElement = document.createElement("tr");
    let item: string;
    for (item in currentClient) {
      if (item === 'creditAccounts' || item === 'debitAccounts') {
        let th: HTMLTableCellElement = document.createElement("th");
        let td: HTMLTableCellElement = document.createElement("td");
        th.innerHTML = item;
        td.innerHTML = String(currentClient[item].length);
        tr.append(th, td);
      } else {
        let th: HTMLTableCellElement = document.createElement("th");
        let td: HTMLTableCellElement = document.createElement("td");
        th.innerHTML = item;
        td.innerHTML = currentClient[item as 'lastName' | 'firstName' | 'patronymic' |
          'identificationNumber' | 'isActiveClient' | 'registrationDate'] as string;
        tr.append(th, td);
      }
    }
    table.append(tr);
    this.root.append(table);
  }

  createRadioInputGroup(name: string, values: string[]): HTMLDivElement {
    let inputGroup: HTMLDivElement = document.createElement("div");
    values.forEach((value: string, index: number) => {
      let temp: number = Date.now() + index;
      let radioInput: HTMLInputElement = document.createElement('input');
      radioInput.type = 'radio';
      radioInput.name = name;
      radioInput.value = value;
      radioInput.id = temp.toString();
      let label: HTMLLabelElement = document.createElement('label');
      label.innerText = value;
      label.htmlFor = temp.toString();
      inputGroup.append(label, radioInput);
    })
    inputGroup.classList.add("input-group");
    inputGroup.addEventListener('change', this.renderAccount.bind(this, inputGroup));
    return inputGroup;
  }

  renderAccount(container: HTMLDivElement, event: Event): void {
    if ((event.target as HTMLInputElement).name  === "account") {
      event.preventDefault();
      if (this.root.querySelector(".debit-account")) {
        this.root.querySelector(".debit-account")!.remove();
      }
      if (this.root.querySelector(".credit-account")) {
        this.root.querySelector(".credit-account")!.remove();
      }
      if ((event.target as HTMLInputElement).value === 'Дебитовый счет') {
        let debitAccount: HTMLFormElement = this.createDebitAccountForm();
        this.root.appendChild(debitAccount);
      } else if ((event.target as HTMLInputElement).value === 'Кредитовый счет') {
        let creditAccount: HTMLFormElement = this.createCreditAccountForm();
        this.root.appendChild(creditAccount);
      }
    }
  }

  createDebitAccountForm(): HTMLFormElement {
    let form: HTMLFormElement = document.createElement("form");
    let balance: HTMLInputElement = this.createInput('number', 'balance', 'Введите сумму личных средств');
    let isActiveSelect: HTMLSelectElement = this.createSelect("isActive",
      ['Выберите активность счета', 'active', 'passive'],
      ['chose activity', true, false]);
    let currencyTypeSelect: HTMLSelectElement = this.createSelect("currencyType",
      ['Выберите валюту', 'UAH', 'USD', 'EUR'],
      ['chose currancy', 'UAH', 'USD', 'EUR']);
    let buttonAddAccount: HTMLButtonElement = this.createButton("button", "btn", "Добавить счет");
    buttonAddAccount.addEventListener("click", this.onAddDebitAccount.bind(this));
    form.classList.add("debit-account");
    form.append(balance, isActiveSelect,
      currencyTypeSelect, buttonAddAccount);
    return form;
  }

  onAddDebitAccount(event: MouseEvent): void {
    event.preventDefault();
    let debitData: IDebetAccount = {
      activationDate: new Date().toLocaleDateString(),
      cardExpirationDate: new Date(new Date().
        setFullYear(new Date().getFullYear() + 5)).toLocaleDateString(),
      balance: 0,
      isActive: true,
      currencyType: 'UAH' 
    };

    let data: FormData = new FormData((event.target as HTMLFormElement).closest("form")!);
    data.forEach((value: FormDataEntryValue, name: string) => {
      Object.assign(debitData, { [name]: value });
    });

    let currentClient: Client = JSON.parse(localStorage.getItem('currentClient')!);
    currentClient.debitAccounts.push(debitData);
    let index: number = Number(localStorage.getItem('currentClientIndex'));
    this.clients[index] = currentClient;
    localStorage.setItem("clients", JSON.stringify(this.clients));

    this.createAccountAction();
  }

  createCreditAccountForm(): HTMLFormElement {
    let form: HTMLFormElement = document.createElement("form");
    let personalFunds: HTMLInputElement = this.createInput('number', 'personalFunds', 'Введите сумму личных средств');
    let limit: HTMLInputElement = this.createInput('number', 'limit', 'Введите сумму кредитного лимита');
    let isActiveSelect: HTMLSelectElement = this.createSelect("isActive",
      ['Выберите активность счета', 'active', 'passive'],
      ['chose activity', true, false]);
    let currencyTypeSelect: HTMLSelectElement = this.createSelect("currencyType",
      ['Выберите валюту', 'UAH', 'USD', 'EUR'],
      ['chose currancy', 'UAH', 'USD', 'EUR']);
    let buttonAddAccount: HTMLButtonElement = this.createButton("button", "btn", "Добавить счет");
    buttonAddAccount.addEventListener("click", this.onAddCreditAccount.bind(this));
    form.classList.add("credit-account");
    form.append(personalFunds, limit,
      isActiveSelect, currencyTypeSelect, buttonAddAccount);
    return form;
  }

  onAddCreditAccount(event: MouseEvent): void {
    event.preventDefault();
    let creditData: ICreditAccount = {
      balance: Number((event.target as HTMLFormElement).closest("form")!.personalFunds.value) +
        Number((event.target as HTMLFormElement).closest("form")!.limit.value),
      activationDate: new Date().toLocaleDateString(),
      cardExpirationDate: new Date(new Date().
        setFullYear(new Date().getFullYear() + 5)).toLocaleDateString(),
      personalFunds: 0,
      limit: 0,
      isActive: true,
      currencyType: 'UAH'
    };

    let data: FormData = new FormData((event.target as HTMLFormElement).closest("form")!);
    data.forEach((value: FormDataEntryValue, name: string) => {
      Object.assign(creditData, { [name]: value });
    });

    let currentClient: Client = JSON.parse(localStorage.getItem('currentClient')!);
    currentClient.creditAccounts.push(creditData);
    let index: number = Number(localStorage.getItem('currentClientIndex'));
    this.clients[index] = currentClient;
    localStorage.setItem("clients", JSON.stringify(this.clients));

    this.createAccountAction();
  }

  countMoneyAmount(currencyType: string): number {
    let moneyAmount: IMoneyObject<number> = {};
    let client: Client;
    for (client of this.clients) {
      let account: IDebetAccount | ICreditAccount;
      for (account of client.debitAccounts) {
        if (account) {
          if (!moneyAmount[account.currencyType]) {
            moneyAmount[account.currencyType] = 0;
          }
          moneyAmount[account.currencyType] += +account.balance;
        }
      }
      for (account of client.creditAccounts) {
        if (account) {
          if (!moneyAmount[account.currencyType]) {
            moneyAmount[account.currencyType] = 0;
          }
          moneyAmount[account.currencyType] += account.balance;
        }
      }
    }
    let sumUah: number = 0;
    let rate: number = 0;
    let currancy: Currancy;
    for (currancy of JSON.parse(localStorage.currancyCourse)) {
      let item: string;
      for (item in moneyAmount) {
          if (currancy.ccy === item) {
            sumUah += moneyAmount[currancy.ccy] * Number(currancy.sale);
          }
          if (currancy.ccy === currencyType) {
            rate = Number(currancy.sale);
          }
      }
    }
    return sumUah / rate;
  }

  countCommonCreditMoney(currencyType: string): number {
    let commonCreditMoney: IMoneyObject<number> = {};
    let client: Client;
    for (client of this.clients) {
      let account: ICreditAccount;
      for (account of client.creditAccounts) {
        if (account) {
          if (!commonCreditMoney[account.currencyType]) {
            commonCreditMoney[account.currencyType] = 0;
          }
          commonCreditMoney[account.currencyType] +=
            account.balance - (+account.personalFunds);
        }
      }
    }
    let sumUah: number = 0;
    let rate: number = 0;
    let currancy: Currancy;
    for (currancy of JSON.parse(localStorage.currancyCourse)) {
      let item: string;
      for (item in commonCreditMoney) {
        if (currancy.ccy === item) {
          sumUah += commonCreditMoney[currancy.ccy] * Number(currancy.sale);
        }
        if (currancy.ccy === currencyType) {
          rate = Number(currancy.sale);
        }
      }
    }
    return sumUah / rate;
  }

  countCreditMoney(currencyType: string, isActive: boolean): number {
    let creditMoney: IMoneyObject<number> = {};
    let client: Client;
    for (client of this.clients) {
      let account: ICreditAccount;
      for (account of client.creditAccounts) {
        if (account) {
          if (!creditMoney[account.currencyType!]) {
            creditMoney[account.currencyType!] = 0;
          }
          if (client.isActiveClient === isActive) {
            creditMoney[account.currencyType!] +=
              account.balance! - (+account.personalFunds);
          }
        }
      }
    }
    let sumUah: number = 0;
    let rate: number = 0;
    let currancy: Currancy;
    for (currancy of JSON.parse(localStorage.currancyCourse)) {
      let item: string;
      for (item in creditMoney) {
        if (currancy.ccy === item) {
          sumUah += creditMoney[currancy.ccy] * Number(currancy.sale);
        }
        if (currancy.ccy === currencyType) {
          rate = Number(currancy.sale);
        }
      }
    }
    return sumUah / rate;
  }

  createCalculationForm(): HTMLFormElement {
    let form: HTMLFormElement = document.createElement('form');
    let operationSelect: HTMLSelectElement = this.createSelect('calculations',
      ['Выберите тип расчета', 'Общее количество денег внутри банка', 'Общие кредитные средства', 'Кредитные средства'],
      ['calculationType', 'countMoneyAmount', 'countCommonCreditMoney', 'countCreditMoney']);
    let currencyTypeSelect: HTMLSelectElement = this.createSelect("currencyType", ['Выберите валюту', 'UAH', 'USD', 'EUR'],
      ['currency', 'UAH', 'USD', 'EUR']);
    let isActiveClientSelect: HTMLSelectElement = this.createSelect("isActiveClient",
      ['clients', 'active', 'passive'], ['clients', true, false]);
    let buttonCalculate: HTMLButtonElement = this.createButton('button', 'btn', 'Рассчитать');
    let output: HTMLElement = this.createTitle('p', '0.00', 'calculation-output')
    buttonCalculate.addEventListener('click', this.onCalculate.bind(this));
    form.append(operationSelect, currencyTypeSelect, isActiveClientSelect, buttonCalculate, output);
    return form;
  }

  onCalculate(event: MouseEvent): void {
    event.preventDefault();
    let operation: 'countCreditMoney' | 'countCommonCreditMoney' | 'countMoneyAmount' = 
      (event.target as HTMLFormElement).closest("form")!.calculations.value;
    let currencyType: string = (event.target as HTMLFormElement).closest("form")!.currencyType.value;
    let isActiveClient: boolean = (event.target as HTMLFormElement).closest("form")!.isActiveClient.value;
    let output: HTMLParagraphElement | null = (event.target as HTMLFormElement).closest("form")!.querySelector('p');
    output!.innerHTML = String(this[operation](currencyType, isActiveClient));
  }
}

class BankMenu {
  root: HTMLElement;
  navigations: Array<INavigation>;
  container: Bank | undefined;

  constructor(root: HTMLElement) {
    this.root = root;

    this.navigations  = [
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

  render(): void {
    this.root.innerHTML = "";
    let ul: HTMLUListElement = document.createElement("ul");

    let div: HTMLDivElement = document.createElement("div");
    this.container = new Bank(div);
    ul.addEventListener("click", this.onContainer.bind(this));

    ul.classList.add("menu");
    for (let i: number = 0; i < this.navigations.length; i++) {
      let li: HTMLLIElement = document.createElement("li");
      li.setAttribute("data-action", this.navigations[i].action);

      if (this.navigations[i].isActive) {
        li.classList.add("active");
        if (typeof this.container[this.navigations[i].action as "clientListAction" | 
          "createClientAction" | "editAction" | "countAction"] === "function") {
          this.container[this.navigations[i].action as "clientListAction" | 
            "createClientAction" | "editAction" | "countAction"]();
        }
      }
        ul.appendChild(li);

        let span: HTMLSpanElement = document.createElement("Span");
        span.innerHTML = this.navigations[i].title;
        li.appendChild(span);
    }

    this.root.append(ul);
    this.root.append(div);
  }

  onContainer(event: MouseEvent): void {
    let element: HTMLLIElement | null = (event.target as HTMLElement).closest("li");
    if (element !== null && !element.classList.contains("active")) {
      event.preventDefault();

      let liActive: HTMLLIElement | null = (element.closest("ul") as HTMLElement).querySelector("li.active");
      liActive!.classList.remove("active");

      element.classList.add("active");

      let action: string | null = element.getAttribute("data-action");
      if (typeof this.container![action as "clientListAction" | 
        "createClientAction" | "editAction" | "countAction"] === "function") {
        this.container![action as "clientListAction" | "createClientAction" | 
          "editAction" | "countAction"]();
      }
    }
  }

}

let root: HTMLDivElement = document.getElementById("root") as HTMLDivElement;
let bank: BankMenu = new BankMenu(root);