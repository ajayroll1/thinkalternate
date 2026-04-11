export default {
  async updateStatus(status) {

    const row = TicketsTable.triggeredRow;

    // 1. Google Sheet update
    await Api2.run({ status: status });

    // 2. Email send
    await Query1.run({
      status: status,
      email: row.Email,
      ticketId: row.TicketID
    });

  }
}