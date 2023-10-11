// Copyright (c) 2023, SowaanERP and contributors
// For license information, please see license.txt

frappe.ui.form.on("Book Transfer", {
  refresh: function (frm) {
    if (frm.doc.docstatus === 1) {
      frm.add_custom_button(__("View Movement Ledger"), function () {
        frappe.route_options = {
          source_library: frm.doc.source_library,
          target_library: frm.doc.library,
          book: frm.doc.book,
          type: frm.doc.purpose,
          copies: frm.doc.number_of_copies,
        };
        frappe.set_route("List", "Book Movement Ledger");
      });
    }
  },

  validate: function (frm) {
    if (frm.doc.number_of_copies <= 0) {
      frappe.throw(__("Number of copies cannot be less than 0."));
    } else if (frm.doc.number_of_copies > frm.doc.copies_available) {
      frappe.throw(
        __("Number of copies cannot be greater than copies available.")
      );
    }
  },

  purpose: async function (frm) {
    if (frm.doc.book != null) frm.trigger("calculation");
  },

  source_library: function (frm) {
    if (frm.doc.book != null) frm.trigger("calculation");
  },

  target_library: function (frm) {
    if (frm.doc.book != null) frm.trigger("calculation");
  },

  book: function (frm) {
    frm.trigger("calculation");
  },

  library: function (frm) {
    var libraries = [];
    frappe.call({
      method: "frappe.client.get_list",
      args: {
        doctype: "Rack",
        filters: {
          library: frm.doc.library,
        },
        fields: ["library"], // Replace with the fields you want to fetch
        order_by: "creation desc",
      },
      callback: function (response) {
        for (let i = 0; i < response.message.length; i++) {
          const e = response.message[i];
          libraries.push(e.library);
        }
        frm.set_value("target_rack", "");
        frm.set_query("target_rack", function () {
          return {
            filters: [["Rack", "library", "in", libraries]],
          };
        });
      },
      error: function (xhr, status, error) {
        console.error("Error:", error);
      },
    });
  },

  source_rack: async function (frm) {
    var doc = frm.doc;
    var source_copies = 0;
    var target_copies = 0;
    if (doc.source_rack) {
      await frappe.call({
        method: "frappe.client.get_list",
        args: {
          doctype: "Book Movement Ledger",
          filters: {
            target_library: doc.source_library,
            book: doc.book,
            target_rack: doc.source_rack,
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
            source_library: doc.source_library,
            book: doc.book,
            source_rack: doc.source_rack,
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

  calculation: async function (frm) {
    var doc = frm.doc;
    var source_copies = 0;
    var target_copies = 0;
    var racks = [];
    if (doc.docstatus !== 1) {
      if (doc.purpose === "Main to Library" && doc.book != null) {
        frappe.call({
          method: "frappe.client.get",
          args: {
            doctype: "Book",
            name: frm.doc.book,
          },
          callback: function (response) {
            // Here, "response" will contain the fetched document object
            if (response.message) {
              frm.set_value(
                "copies_available",
                response.message.copies_available
              );
            } else {
              console.log("Document not found.");
            }
          },
          error: function (xhr, status, error) {
            console.error("Error:", error);
          },
        });
      } else if (doc.purpose === "Library to Library" && doc.book !== null) {
        await frappe.call({
          method: "frappe.client.get_list",
          args: {
            doctype: "Book Movement Ledger",
            filters: {
              target_library: doc.source_library,
              book: doc.book,
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
              source_library: doc.source_library,
              book: doc.book,
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
        frm.set_value("source_rack", "");
        frm.set_query("source_rack", function () {
          return {
            filters: [["Rack", "name", "in", racks]],
          };
        });
      }
    }
  },
});
