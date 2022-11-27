/**
 * @jest-environment jsdom
 */
import "@testing-library/jest-dom";
import { screen, waitFor } from "@testing-library/dom";
import userEvent from "@testing-library/user-event";
import BillsUI from "../views/BillsUI.js";
import { bills } from "../fixtures/bills.js";
import { ROUTES_PATH, ROUTES } from "../constants/routes.js";
import mockStore from "../__mocks__/store";
import Bills from "../containers/Bills.js";
import router from "../app/Router.js";
/*import { row } from "../views/BillsUI.js";*/
import { localStorageMock } from "../__mocks__/localStorage.js";
jest.mock("../app/store", () => mockStore);

describe(" Given I am connected as an employee ", () => {
  //objet define property allowd to add or to modified property in object 
  Object.defineProperty(window, "localStorage", {
    value: localStorageMock,
  });
  //im connected as employee
  window.localStorage.setItem(
    "user",
    JSON.stringify({
      type: "Employee",
    })
  );
  //creation of a div like in the dom
  const root = document.createElement("div");
  root.setAttribute("id", "root");
  document.body.append(root);
  router();
  //navigation on the page bills
  window.onNavigate(ROUTES_PATH.Bills);

  describe(" When I am on the Bills Page ", () => {
    test(" Then bill icon in vertical layout should be highlighted ", async () => {
      //getting icons
      await waitFor(() => screen.getByTestId("icon-window"));
      const windowIcon = screen.getByTestId("icon-window");
      // checking if the icon have a classe active -icon, its her that makes thing highlight
      /************    adding expect  ************************************/
      expect(windowIcon).toHaveClass("active-icon");
    });

    /*********test increasing dates **************************************************/
    test("Then bills on the Bills Page should be ordered from the earliest to the latest", () => {
      //putting bills to the DOM
      document.body.innerHTML = BillsUI({ data: bills });
      //getting all dates,
      const dates = screen
        .getAllByText(
          /^(19|20)\d\d[- /.](0[1-9]|1[012])[- /.](0[1-9]|[12][0-9]|3[01])$/i
        )
        .map((a) => a.innerHTML);
      expect(dates).toEqual([...dates].sort((a, b) => (a < b ? 1 : -1)));
    });

    /*********test opening new bill after click ************** */
    describe(`When i click on the the "Nouvelle facture" button`, () => {
      test(`The handler to open new form should be done`, () => {
        const onNavigate = (pathname) => {
          document.body.innerHTML = ROUTES({ pathname });
        };
        //making new bill for test
        const bill = new Bills({
          document,
          onNavigate,
          mockStore,
          localStorage: window.localStorage,
        });
        // getting fonction handleClickNewBill
        const handleClickNewBill = jest.fn((e) => bill.handleClickNewBill(e));
        //getting the button to triger the function
        const buttonNewBill = screen.getByTestId("btn-new-bill");
        buttonNewBill.addEventListener("click", handleClickNewBill);
        //simulate the click
        userEvent.click(buttonNewBill);
        //expection to function get called
        expect(handleClickNewBill).toHaveBeenCalled();
        expect(screen.getAllByText("Envoyer une note de frais")).toBeTruthy();
        expect(screen.getByTestId("form-new-bill")).toBeTruthy();
      });
    });
    /**************test simulation openning after eye click justification paper*****************/
    describe("When i click on the eye icon", () => {
      test("Then the modal with justificatif of the bill should get opened ", () => {
        const onNavigate = (pathname) => {
          document.body.innerHTML = ROUTES({ pathname });
        };
        document.body.innerHTML = BillsUI({ data: bills });
        const bill = new Bills({
          document,
          onNavigate,
          mockStore,
          localStorage: window.localStorage,
        });
        $.fn.modal = jest.fn();
        //getting just first eye for the test
        const eyes_icons = screen.getAllByTestId("icon-eye")[0];
        //getting opening click eye icon
        const handleClickIcon_eye = jest.fn(() =>
          bill.handleClickIconEye(eyes_icons)
        );

        //simulation click
        eyes_icons.addEventListener("click", handleClickIcon_eye);
        userEvent.click(eyes_icons);
        expect(handleClickIcon_eye).toHaveBeenCalled();
        expect(screen.getAllByText("Justificatif")).toBeTruthy();
      });
    });
  });
  /***********************test for errors********************/
  describe("When an error occurs on API", () => {
    beforeEach(() => {
      jest.spyOn(mockStore, "bills");
      Object.defineProperty(window, "localStorage", {
        value: localStorageMock,
      });
      window.localStorage.setItem(
        "user",
        JSON.stringify({
          type: "Employee",
          email: "a@a",
        })
      );
      const root = document.createElement("div");
      root.setAttribute("id", "root");
      document.body.appendChild(root);
      router();
    });
    /***************test error 404 page not found****************************/
    test("fetches bills from an API and fails with 404 message error", async () => {
      mockStore.bills.mockImplementationOnce(() => {
        return {
          list: () => {
            return Promise.reject(new Error("Erreur 404"));
          },
        };
      });
      const html = BillsUI({ error: "Erreur 404" });
      document.body.innerHTML = html;
      
      const message = await screen.getByText(/Erreur 404/);
      expect(message).toBeTruthy();
    });
    /***********************test 500 error from server, from backend***********************************/
    test("fetches messages from an API and fails with 500 message error", async () => {
      mockStore.bills.mockImplementationOnce(() => {
        return {
          list: () => {
            return Promise.reject(new Error("Erreur 500"));
          },
        };
      });

      
      const html = BillsUI({ error: "Erreur 500" });
      document.body.innerHTML = html;
      const message = await screen.getByText(/Erreur 500/);
      expect(message).toBeTruthy();
    });
  });
});
