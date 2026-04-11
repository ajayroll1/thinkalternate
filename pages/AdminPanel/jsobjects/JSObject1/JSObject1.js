export default {
  getTickets() {
    const rawTickets = Api1.data;
    const normalizeRows = (rows) =>
      (rows || []).filter((ticket) => {
        if (!ticket || typeof ticket !== "object") {
          return false;
        }

        return Object.values(ticket).some(
          (value) => value !== undefined && value !== null && value !== ""
        );
      });

    if (Array.isArray(rawTickets)) {
      return normalizeRows(rawTickets);
    }

    if (Array.isArray((rawTickets || {}).data)) {
      return normalizeRows(rawTickets.data);
    }

    if (Array.isArray((rawTickets || {}).rows)) {
      return normalizeRows(rawTickets.rows);
    }

    if (Array.isArray((rawTickets || {}).records)) {
      return normalizeRows(rawTickets.records);
    }

    if (Array.isArray((rawTickets || {}).body)) {
      return normalizeRows(rawTickets.body);
    }

    if (typeof rawTickets === "string") {
      try {
        const parsedTickets = JSON.parse(rawTickets);
        return Array.isArray(parsedTickets)
          ? normalizeRows(parsedTickets)
          : this.getTicketsFromObject(parsedTickets, normalizeRows);
      } catch (error) {
        return [];
      }
    }

    return this.getTicketsFromObject(rawTickets, normalizeRows);
  },

  getTicketsFromObject(rawTickets, normalizeRows) {
    if (!rawTickets || typeof rawTickets !== "object") {
      return [];
    }

    const nestedArrays = Object.values(rawTickets).filter(Array.isArray);

    if (nestedArrays.length === 1) {
      return normalizeRows(nestedArrays[0]);
    }

    if (nestedArrays.length > 1) {
      return normalizeRows(nestedArrays.flat());
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

  getTicketContext(overrides = {}) {
    const updatedRow = TicketsTable.updatedRow || {};
    const triggeredRow = TicketsTable.triggeredRow || {};
    const selectedRow = TicketsTable.selectedRow || {};
    const pickFirst = (...values) =>
      values.find((value) => value !== undefined && value !== null && value !== "");

    const rowIndex = pickFirst(
      overrides.rowIndex,
      updatedRow.rowIndex,
      triggeredRow.rowIndex,
      selectedRow.rowIndex
    );

    return {
      rowIndex,
      ticketId:
        pickFirst(
          overrides.ticketId,
          updatedRow.TicketID,
          triggeredRow.TicketID,
          selectedRow.TicketID
        ) || "",
      name:
        pickFirst(overrides.name, updatedRow.Name, triggeredRow.Name, selectedRow.Name) ||
        "Customer",
      email:
        (
          pickFirst(
            overrides.email,
            updatedRow.Email,
            triggeredRow.Email,
            selectedRow.Email
          ) || ""
        )
          .toString()
          .trim(),
      subject:
        pickFirst(
          overrides.subject,
          updatedRow.Subject,
          triggeredRow.Subject,
          selectedRow.Subject
        ) || "",
      priority:
        pickFirst(
          overrides.priority,
          updatedRow.Priority,
          triggeredRow.Priority,
          selectedRow.Priority
        ) || "",
      status:
        pickFirst(
          overrides.status,
          updatedRow.Status,
          triggeredRow.Status,
          selectedRow.Status
        ) || "Open",
      adminNotes:
        (
          typeof overrides.adminNotes !== "undefined"
            ? overrides.adminNotes
            : typeof updatedRow.AdminNotes !== "undefined"
              ? updatedRow.AdminNotes
              : pickFirst(triggeredRow.AdminNotes, selectedRow.AdminNotes) || ""
        )
          .toString()
          .trim(),
      updatedAt: overrides.updatedAt || moment().format("YYYY-MM-DD HH:mm:ss")
    };
  },

  async syncTicketUpdate({
    status,
    adminNotes,
    successMessage,
    failureMessage
  } = {}) {
    try {
      const ticket = this.getTicketContext({ status, adminNotes });

      if (ticket.rowIndex === undefined || ticket.rowIndex === null || ticket.rowIndex === "") {
        throw new Error("No ticket row found to update.");
      }

      await Api2.run({
        rowIndex: ticket.rowIndex,
        status: ticket.status,
        adminNotes: ticket.adminNotes,
        updatedAt: ticket.updatedAt
      });

      let emailIssue = false;

      if (ticket.email) {
        try {
          await Query1.run({
            ticketId: ticket.ticketId,
            email: ticket.email,
            name: ticket.name,
            subject: ticket.subject,
            priority: ticket.priority,
            status: ticket.status,
            adminNotes: ticket.adminNotes,
            updatedAt: ticket.updatedAt
          });
        } catch (emailError) {
          emailIssue = true;
        }
      } else {
        emailIssue = true;
      }

      await Api1.run();
      showAlert(
        emailIssue
          ? `${successMessage} Sheet updated, but user email could not be sent.`
          : successMessage,
        emailIssue ? "warning" : "success"
      );

      return ticket;
    } catch (error) {
      showAlert(failureMessage || "Failed to update ticket.", "error");
      throw error;
    }
  },

  async saveNotes() {
    return this.syncTicketUpdate({
      successMessage: "Admin notes saved successfully.",
      failureMessage: "Failed to save admin notes."
    });
  },

  async updateStatus(status) {
    return this.syncTicketUpdate({
      status,
      successMessage: `Ticket status updated to ${status}.`,
      failureMessage: "Failed to update ticket status."
    });
  }
}
