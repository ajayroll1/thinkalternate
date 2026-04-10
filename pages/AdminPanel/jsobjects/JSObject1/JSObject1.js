export default {
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
      await Api2.run({ status });
      let emailIssue = false;

      try {
        await Query1.run({ status });
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
