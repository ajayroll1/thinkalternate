export default {
  isFormValid() {
    const name = (InputName.text || "").trim();
    const email = (InputEmail.text || "").trim();
    const phoneDigits = (InputPhone.text || "").replace(/\D/g, "");
    const subject = (SubjectInput.text || "").trim();
    const description = (InputDescription.text || "").trim();
    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    return (
      name.length >= 3 &&
      emailPattern.test(email) &&
      (!phoneDigits || phoneDigits.length === 10) &&
      subject.length >= 5 &&
      description.length >= 10
    );
  },

  async submitTicket() {
    const name = (InputName.text || "").trim();
    const email = (InputEmail.text || "").trim();
    const phoneDigits = (InputPhone.text || "").replace(/\D/g, "");
    const category = SelectCategory.selectedOptionValue || "";
    const subject = (SubjectInput.text || "").trim();
    const description = (InputDescription.text || "").trim();
    const priority = SelectPriority.selectedOptionValue || "";
    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (name.length < 3) {
      showAlert("Name must be at least 3 characters long.", "warning");
      return false;
    }

    if (!emailPattern.test(email)) {
      showAlert("Please enter a valid email address.", "warning");
      return false;
    }

    if (phoneDigits && phoneDigits.length !== 10) {
      showAlert("Phone number must contain exactly 10 digits.", "warning");
      return false;
    }

    if (subject.length < 5) {
      showAlert("Subject must be at least 5 characters long.", "warning");
      return false;
    }

    if (description.length < 10) {
      showAlert("Description must be at least 10 characters long.", "warning");
      return false;
    }

    try {
      const existingTickets = await FetchTicketsForId.run();
      const highestTicketNumber = (existingTickets || []).reduce(
        (maxTicketNumber, currentTicket, currentIndex) => {
          const ticketId = (currentTicket.TicketID || "").toString();
          const match = ticketId.match(/^TKT-(\d+)$/);

          if (match) {
            return Math.max(maxTicketNumber, Number(match[1]));
          }

          return Math.max(maxTicketNumber, currentIndex + 1);
        },
        0
      );
      const ticketId = `TKT-${String(highestTicketNumber + 1).padStart(4, "0")}`;

      await InsertTicket.run({ ticketId });
      let emailIssue = false;

      try {
        await SendCustomerReceipt.run({
          ticketId,
          name,
          email,
          subject
        });
      } catch (customerEmailError) {
        emailIssue = true;
      }

      try {
        await SendAdminAlert.run({
          ticketId,
          name,
          email,
          phone: phoneDigits,
          category,
          description,
          subject,
          priority
        });
      } catch (adminEmailError) {
        emailIssue = true;
      }

      resetWidget("InputName", true);
      resetWidget("InputEmail", true);
      resetWidget("InputPhone", true);
      resetWidget("SelectCategory", true);
      resetWidget("SubjectInput", true);
      resetWidget("InputDescription", true);
      resetWidget("SelectPriority", true);

      showAlert(
        emailIssue
          ? "Ticket created, but one or more emails could not be sent.\nTicket ID: " +
              ticketId
          : "Ticket created successfully.\nYour Ticket ID: " + ticketId,
        emailIssue ? "warning" : "success"
      );
      return ticketId;
    } catch (error) {
      showAlert("Ticket could not be created. Please try again.", "error");
      throw error;
    }
  }
}
