import { toast } from "sonner";

// Utility function to decode base64
export const decodeBase64 = (str: string): string => {
    try {
      return decodeURIComponent(
        atob(str)
          .split('')
          .map(c => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
          .join('')
      );
    } catch {
      // If decoding fails, return the original string
      return str;
    }
  };


  export const getStatusColor = (status: string): string => {
    const colors: Record<string, string> = {
      delivered: 'bg-green-100 text-green-800 border-green-200',
      read: 'bg-blue-100 text-blue-800 border-blue-200',
      replied: 'bg-purple-100 text-purple-800 border-purple-200',
      failed: 'bg-red-100 text-red-800 border-red-200'
    };
    return colors[status] || 'bg-gray-100 text-gray-800 border-gray-200';
  };



  export const exportMessages = (filteredMessages): void => {
    try {
      const csvContent = [
        ['Date', 'From', 'To', 'Message', 'Status', 'Direction', 'Port', 'Slot'],
        ...filteredMessages.map(msg => [
          new Date(msg.timestamp).toLocaleString(),
          msg.from,
          msg.to,
          `"${msg.sms.replace(/"/g, '""')}"`,
          msg.status,
          msg.direction,
          msg.port.toString(),
          msg.slot.toString()
        ])
      ].map(row => row.join(',')).join('\n');

      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.setAttribute('href', url);
      link.setAttribute('download', `sms-inbox-${new Date().toISOString().split('T')[0]}.csv`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (error) {
      console.error('Failed to export messages:', error);
      toast.error('Failed to export messages');
    }
  };