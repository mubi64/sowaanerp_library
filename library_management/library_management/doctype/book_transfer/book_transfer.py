# Copyright (c) 2023, SowaanERP and contributors
# For license information, please see license.txt

import frappe
from frappe.model.document import Document

class BookTransfer(Document):
	def on_submit(self):
		if self.purpose == "Main to Library":
			self.subtract_book_qty()
		self.make_book_ledger()

	def subtract_book_qty(self):
		book = frappe.get_doc("Book", self.book)
		book.number_of_copies = book.number_of_copies - self.number_of_copies
		book.save()

	def make_book_ledger(self):
		doc = frappe.get_doc({
			'doctype': 'Book Movement Ledger',
			'type': self.purpose,
			'book': self.book,
			'source_library': None if self.purpose == "Main to Library" else self.source_library,
			'source_rack': None if self.purpose == "Main to Library" else self.source_rack,
			'target_library': self.library,
			'target_rack': self.target_rack,
			'copies': self.number_of_copies
		})
		doc.insert()
