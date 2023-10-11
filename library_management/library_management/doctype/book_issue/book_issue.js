// Copyright (c) 2023, SowaanERP and contributors
// For license information, please see license.txt

frappe.ui.form.on("Book Issue", {
  refresh: function (frm) {
    if (frm.doc.docstatus === 1) {
      frm.add_custom_button(__("Book Return"), function () {
        var name = frm.doc.name;
        // frappe.route_options = {
        //   book_issue: frm.doc.name,
        // };
        // console.log(frappe.route_options  );
        frappe.set_route("Form", "Book Return", "new-book-return-1");
        frappe.ui.form.on("Book Return", {
          refresh: function (frm) {
            // Set field values
            frm.set_value("book_issue", name);
            // You can set more field values here
          },

          after_save: function (frm) {
            location.reload();
          },
        });
      });

      frm.add_custom_button(__("View Movement Ledger"), function () {
        frappe.route_options = {
          type: "Book Issue",
          source_library: frm.doc.library,
          book: frm.doc.book,
          book_issued_to: frm.doc.issue_to,
        };
        frappe.set_route("List", "Book Movement Ledger");
      });
    }
  },

  library: async function (frm) {
    var books = [];
    if (frm.doc.library != null) {
      await frappe.call({
        method: "frappe.client.get_list",
        args: {
          doctype: "Book Movement Ledger",
          filters: {
            target_library: frm.doc.library, // source_library
          },
          fields: ["book"], // Replace with the fields you want to fetch
          order_by: "creation desc",
        },
        callback: function (response) {
          for (let i = 0; i < response.message.length; i++) {
            const e = response.message[i];
            books.push(e.book);
          }
        },
        error: function (xhr, status, error) {
          console.error("Error:", error);
        },
      });
      frm.set_value("book", "");
      frm.set_query("book", function () {
        return {
          filters: [["Book", "name", "in", books]],
        };
      });
    }
  },

  rack: async function (frm) {
    var doc = frm.doc;
    var source_copies = 0;
    var target_copies = 0;
    if (doc.rack) {
      await frappe.call({
        method: "frappe.client.get_list",
        args: {
          doctype: "Book Movement Ledger",
          filters: {
            target_library: doc.library,
            book: doc.book,
            target_rack: doc.rack,
          },
          fields: ["*"], // Replace with the fields you want to fetch
          order_by: "creation desc",
        },
        callback: function (response) {
          for (let i = 0; i < response.message.length; i++) {
            const e = response.message[i];
            source_copies += e.copies;
          }
        },
        error: function (xhr, status, error) {
          console.error("Error:", error);
        },
      });
      await frappe.call({
        method: "frappe.client.get_list",
        args: {
          doctype: "Book Movement Ledger",
          filters: {
            source_library: doc.library,
            book: doc.book,
            source_rack: doc.rack,
          },
          fields: ["*"], // Replace with the fields you want to fetch
          order_by: "creation desc",
        },
        callback: function (response) {
          for (let i = 0; i < response.message.length; i++) {
            const e = response.message[i];
            target_copies += e.copies;
          }
        },
        error: function (xhr, status, error) {
          console.error("Error:", error);
        },
      });
      var total_copies = source_copies - target_copies;
      frm.set_value("copies_available", total_copies);
    }
  },

  book: function (frm) {
    frm.trigger("calculation");
  },

  calculation: async function (frm) {
    var source_copies = 0;
    var target_copies = 0;
    var racks = [];
    if (frm.doc.docstatus !== 1) {
      await frappe.call({
        method: "frappe.client.get_list",
        args: {
          doctype: "Book Movement Ledger",
          filters: {
            target_library: frm.doc.library,
            book: frm.doc.book,
          },
          fields: ["*"], // Replace with the fields you want to fetch
          order_by: "creation desc",
        },
        callback: function (response) {
          for (let i = 0; i < response.message.length; i++) {
            const e = response.message[i];
            source_copies += e.copies;
            racks.push(e.target_rack);
          }
        },
        error: function (xhr, status, error) {
          console.error("Error:", error);
        },
      });
      await frappe.call({
        method: "frappe.client.get_list",
        args: {
          doctype: "Book Movement Ledger",
          filters: {
            source_library: frm.doc.library,
            book: frm.doc.book,
          },
          fields: ["*"], // Replace with the fields you want to fetch
          order_by: "creation desc",
        },
        callback: function (response) {
          for (let i = 0; i < response.message.length; i++) {
            const e = response.message[i];
            target_copies += e.copies;
            racks.push(e.source_rack);
          }
        },
        error: function (xhr, status, error) {
          console.error("Error:", error);
        },
      });
      var total_copies = source_copies - target_copies;
      frm.set_value("copies_available", total_copies);
      frm.set_value("rack", "");
      frm.set_query("rack", function () {
        return {
          filters: [["Rack", "name", "in", racks]],
        };
      });
    }
  },
});
