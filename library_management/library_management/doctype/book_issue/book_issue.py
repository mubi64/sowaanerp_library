# Copyright (c) 2023, SowaanERP and contributors
# For license information, please see license.txt

import frappe
from frappe.model.document import Document

class BookIssue(Document):
	
	def on_submit(self):
		doc = frappe.get_doc({
				'doctype': 'Book Movement Ledger',
				'type': 'Book Issue',
				'book': self.book,
				'source_library': self.library,
				'source_rack': self.rack,
				'copies': 1,
				'book_issued_to': self.issue_to
			})
		doc.insert()

