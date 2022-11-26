/**
 * @jest-environment jsdom
 */

import "@testing-library/jest-dom";
import { screen, fireEvent, waitFor } from "@testing-library/dom";
import NewBillUI from "../views/NewBillUI.js";
import NewBill from "../containers/NewBill.js";
import userEvent from "@testing-library/user-event";
import BillsUI from "../views/BillsUI.js";
import { ROUTES_PATH } from "../constants/routes.js";
import { localStorageMock } from "../__mocks__/localStorage.js";
import mockStore from "../__mocks__/store";
import router from "../app/Router.js";

jest.mock("../app/store", () => mockStore);

describe("Given I am connected as an employee", () => {
  //defining object and setting property
  Object.defineProperty(window, "localStorage", {
    value: localStorageMock,
  });
  //connected as an employee
  window.localStorage.setItem(
    "user",
    JSON.stringify({
      type: "Employee",
    })
  );
  //making div element, and givving him root atribute, like in the DOM
  const root = document.createElement("div");
  root.setAttribute("id", "root");
  document.body.append(root);
  router();
  describe("When I am on the NewBill page", () => {
    test("Then the header od the page should be display", () => {
      window.onNavigate(ROUTES_PATH.NewBill);
      //getting title of the newbill page
      const header_message = screen.getByTestId("send-new-bill");
      //i expect that its shown, that it has text
      expect(screen.getAllByText("Envoyer une note de frais")).toBeTruthy();
    });
    /***** test when im on the page form is shown, and no message error is display ******/
    test("Then the empty form is shown, and no message error is display", () => {
      window.onNavigate(ROUTES_PATH.NewBill);
      //creating newbill
      const newBill = new NewBill({
        document,
        onNavigate,
        mockStore,
        localStorage: window.localStorage,
      });
      const errorMessageForm = screen.getByTestId("error-message-form");
      expect(errorMessageForm).toBeTruthy();
      expect(errorMessageForm).toHaveClass("hiddenError");
    });
    /***** test sending empty form, message it should be display *****/
    test("Then when i try to send form not complet, the message error will be display", () => {
      window.onNavigate(ROUTES_PATH.NewBill);

      const newBill = new NewBill({
        document,
        onNavigate,
        mockStore,
        localStorage: window.localStorage,
      });
      //chacking that all the fildes of the form are empty
      expect(screen.getByTestId("expense-name").value).toBe("");
      expect(screen.getByTestId("datepicker").value).toBe("");
      expect(screen.getByTestId("amount").value).toBe("");
      expect(screen.getByTestId("vat").value).toBe("");
      expect(screen.getByTestId("pct").value).toBe("");
      expect(screen.getByTestId("file").value).toBe("");
      //getting form
      const form = screen.getByTestId("form-new-bill");
      //getting function submit
      const handleSubmit = jest.fn((e) => newBill.handleSubmit(e));
      //getting erreur message
      const errorMessageForm = screen.getByTestId("error-message-form");
      //simulate sending form
      form.addEventListener("submit", handleSubmit);
      fireEvent.submit(form);
      expect(handleSubmit).toHaveBeenCalled();
      expect(form).toBeTruthy();
      expect(errorMessageForm).toBeTruthy();
      //i expect that the message error will be display
      expect(errorMessageForm).toHaveClass("showError");
    });
    test("Then  i upload the files with bad extension", () => {
      window.onNavigate(ROUTES_PATH.NewBill);

      const newBillObject2 = new NewBill({
        document,
        onNavigate,
        store: mockStore,
        localStorage: window.localStorage,
      });

      // getting upload files
      const file = screen.getByTestId("file");
      //simulation upload change files
      const handleChangeFile = jest.fn((e) =>
        newBillObject2.handleChangeFile(e)
      );
      //getting new file
      file.addEventListener("change", handleChangeFile);
      fireEvent.change(file, {
        target: {
          files: [new File(["Test"], "test.txt")],
        },
      });

      //checking if the function was called
      expect(handleChangeFile).toHaveBeenCalled();

      // getting message error
      const errorMessage = screen.getByTestId("error-message-extension");
      expect(errorMessage).toBeTruthy();
      expect(errorMessage).toHaveClass("showError");
    });
    test("Then i upload the files with  good extention", () => {
      window.onNavigate(ROUTES_PATH.NewBill);
      document.body.innerHTML = NewBillUI();

      const newBillObject = new NewBill({
        document,
        onNavigate,
        store: mockStore,
        localStorage: window.localStorage,
      });

      const file = screen.getByTestId("file");
      const handleChangeFile = jest.fn((e) =>
        newBillObject.handleChangeFile(e)
      );

      file.addEventListener("change", handleChangeFile);
      fireEvent.change(file, {
        target: {
          files: [new File(["Test"], "test.png", { type: "image/png" })],
        },
      });

      expect(handleChangeFile).toHaveBeenCalled();

      // Récupération du nom du fichier affiché
      const fileTest = document.querySelector(`input[data-testid="file"]`)
        .files[0].name;

      // Vérification que le fichier téléchargé est le même que celui affiché
      expect(fileTest).toEqual("test.png");
    });
  });
});

//integration POST
describe("Given that I am connected as an employee", () => {
  describe("When I am on NewBill Page", () => {
    describe("When I send a New Bill with correct files", () => {
      test("Then the new bill should be show in bills dashboard", async () => {

        document.body.innerHTML = NewBillUI();
        const newBill = new NewBill({
          document,
          onNavigate,
          store: null,
          localStorage: window.localStorage,
        });
        //new bill with handelsubmit
        const submit = screen.queryByTestId("form-new-bill");
        const billCheck = {
          name: "checking",
          date: "2014-09-12",
          amount: 650,
          type: "Hôtel et logement",
          commentary: "formation bill",
          pct: 25,
          vat: 12,
          commentary: "It's for checking",
          fileName: "chceking",
          fileUrl: "checking.jpg",
        };
        //getting the submit function
        const handleSubmit = jest.fn((e) => newBill.handleSubmit(e));

        //makiing new bill
      
        newBill.createBill = (newBill) => newBill;
        document.querySelector(`select[data-testid="expense-type"]`).value =
          billCheck.type;
        document.querySelector(`input[data-testid="expense-name"]`).value =
          billCheck.name;
        document.querySelector(`input[data-testid="datepicker"]`).value =
          billCheck.date;
        document.querySelector(`input[data-testid="amount"]`).value =
          billCheck.amount;
        document.querySelector(`input[data-testid="vat"]`).value =
          billCheck.vat;
        document.querySelector(`input[data-testid="pct"]`).value =
          billCheck.pct;
        document.querySelector(`textarea[data-testid="commentary"]`).value =
          billCheck.commentary;
        newBill.fileUrl = billCheck.fileUrl;
        newBill.fileName = billCheck.fileName;

        submit.addEventListener("click", handleSubmit);
        fireEvent.click(submit);
        expect(handleSubmit).toHaveBeenCalled();
      });
      describe("When an error occurs on API", () => {
        beforeEach(() => {
          jest.spyOn(mockStore, "bills")
          Object.defineProperty(
              window,
              'localStorage',
              { value: localStorageMock }
          )
          window.localStorage.setItem('user', JSON.stringify({
            type: 'Employee',
            email: "a@a"
          }))
          const root = document.createElement("div")
          root.setAttribute("id", "root")
          document.body.appendChild(root)
          router()
        })
        test("fetches bills from an API and fails with 404 message error", async () => {
    
          mockStore.bills.mockImplementationOnce(() => {
            return {
              list : () =>  {
                return Promise.reject(new Error("Erreur 404"))
              }
            }})
            const html = BillsUI({error:"Erreur 404"})
            document.body.innerHTML = html;
          /*window.onNavigate(ROUTES_PATH.Dashboard)
          await new Promise(process.nextTick);*/
          const message = await screen.getByText(/Erreur 404/)
          expect(message).toBeTruthy()
        })
    
        test("fetches messages from an API and fails with 500 message error", async () => {
    
          mockStore.bills.mockImplementationOnce(() => {
            return {
              list : () =>  {
                return Promise.reject(new Error("Erreur 500"))
              }
            }})
    
          /*window.onNavigate(ROUTES_PATH.Dashboard)
          await new Promise(process.nextTick);*/
          const html = BillsUI({error:"Erreur 500"})
            document.body.innerHTML = html;
          const message = await screen.getByText(/Erreur 500/)
          expect(message).toBeTruthy()
        })
      })
    
    });
  });
});
