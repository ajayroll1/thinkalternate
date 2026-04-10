export default {
  getTickets() {
    const rawTickets = Api1.data;

    if (Array.isArray(rawTickets)) {
      return rawTickets;
    }

    if (Array.isArray((rawTickets || {}).data)) {
      return rawTickets.data;
    }

    if (Array.isArray((rawTickets || {}).rows)) {
      return rawTickets.rows;
    }

    if (rawTickets && typeof rawTickets === "object") {
      const nestedArrays = Object.values(rawTickets).filter(Array.isArray);

      if (nestedArrays.length === 1) {
        return nestedArrays[0];
      }

      if (nestedArrays.length > 1) {
        return nestedArrays.flat();
      }
    }

    return [];
  },

  filteredTickets() {
    const tickets = this.getTickets();
    const statusFilter = (FilterStatus.selectedOptionValue || "").trim();
    const categoryFilter = (FilterCategory.selectedOptionValue || "").trim();
    const priorityFilter = (FilterPriority.selectedOptionValue || "").trim();
    const searchValue = (SearchTickets.text || "").trim().toLowerCase();

    return tickets.filter((ticket) => {
      const matchesStatus = !statusFilter || (ticket.Status || "") === statusFilter;
      const matchesCategory =
        !categoryFilter || (ticket.Category || "") === categoryFilter;
      const matchesPriority =
        !priorityFilter || (ticket.Priority || "") === priorityFilter;
      const matchesSearch =
        !searchValue ||
        [ticket.TicketID, ticket.Email, ticket.Subject].some((value) =>
          ((value || "").toString().toLowerCase().includes(searchValue))
        );

      return matchesStatus && matchesCategory && matchesPriority && matchesSearch;
    });
  },

  countByStatus(status) {
    return this.getTickets().filter((ticket) => (ticket.Status || "") === status).length;
  },

  async saveNotes() {
    try {
      await Api2.run();
      await Api1.run();
      showAlert("Admin notes saved.", "success");
    } catch (error) {
      showAlert("Failed to save admin notes.", "error");
      throw error;
    }
  },

  async updateStatus(status) {
    try {
      const selectedTicket = TicketsTable.triggeredRow || {};

      await Api2.run({ status });
      let emailIssue = false;

      try {
        await Query1.run({
          status,
          ticketId: selectedTicket.TicketID || "",
          email: selectedTicket.Email || "",
          name: selectedTicket.Name || "",
          priority: selectedTicket.Priority || "",
          adminNotes:
            typeof (TicketsTable.updatedRow || {}).AdminNotes !== "undefined"
              ? (TicketsTable.updatedRow || {}).AdminNotes
              : selectedTicket.AdminNotes || "",
          updatedAt: moment().format("YYYY-MM-DD HH:mm:ss")
        });
      } catch (emailError) {
        emailIssue = true;
      }

      await Api1.run();
      showAlert(
        emailIssue
          ? `Ticket status updated to ${status}, but email could not be sent.`
          : `Ticket status updated to ${status}.`,
        emailIssue ? "warning" : "success"
      );
    } catch (error) {
      showAlert("Failed to update ticket status.", "error");
      throw error;
    }
  }
}
