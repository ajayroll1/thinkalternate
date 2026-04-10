export default {
  async submitTicket() {

    // Step 1: Run Insert Query
    await InsertTicket.run();

    // Step 2: Generate Ticket ID
    const ticketId = "TICKET-" + new Date().getTime();

    // Step 3: Show Alert
    showAlert(
      "✅ Ticket Created Successfully\nYour Ticket ID: " + ticketId,
      "success"
    );

    // Step 4: Return Ticket ID
    return ticketId;
  }
}