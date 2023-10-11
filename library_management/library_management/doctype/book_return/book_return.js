// Copyright (c) 2023, SowaanERP and contributors
// For license information, please see license.txt

frappe.ui.form.on('Book Return', {
	refresh: function(frm) {
		if (frm.doc.docstatus === 1) {
			frm.add_custom_button(__("View Movement Ledger"), function () {
			  frappe.route_options = {
				type: frm.doc.book_is_lost ? 'Book Lost' : 'Book Return',
			  };
			  frappe.set_route("List", "Book Movement Ledger");
			});
		  }
	}
});
