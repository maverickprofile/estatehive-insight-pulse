// Mock data for testing WhatsApp integration UI
export const mockWatiResponse = {
  messages: {
    items: [
      {
        id: "msg_1",
        text: "Hi, I'm interested in the property you listed. Can you provide more details?",
        whatsappNumber: "+1234567890",
        owner: false,
        created: "2024-01-15T10:30:00.000Z",
        direction: "inbound"
      },
      {
        id: "msg_2", 
        text: "Of course! Which property are you referring to? We have several listings available.",
        whatsappNumber: "+1234567890",
        owner: true,
        created: "2024-01-15T10:35:00.000Z",
        direction: "outbound"
      },
      {
        id: "msg_3",
        text: "The 3-bedroom apartment in downtown.",
        whatsappNumber: "+1234567890", 
        owner: false,
        created: "2024-01-15T10:40:00.000Z",
        direction: "inbound"
      },
      {
        id: "msg_4",
        text: "Great choice! That property is available for $2,500/month. Would you like to schedule a viewing?",
        whatsappNumber: "+1234567890",
        owner: true,
        created: "2024-01-15T10:45:00.000Z", 
        direction: "outbound"
      },
      {
        id: "msg_5",
        text: "Hello! Do you have any 2-bedroom units available?",
        whatsappNumber: "+0987654321",
        owner: false,
        created: "2024-01-15T14:20:00.000Z",
        direction: "inbound"
      },
      {
        id: "msg_6",
        text: "Yes! We have several 2-bedroom options. What's your budget range?",
        whatsappNumber: "+0987654321",
        owner: true,
        created: "2024-01-15T14:25:00.000Z",
        direction: "outbound"
      },
      {
        id: "msg_7",
        text: "Looking for something under $2000.",
        whatsappNumber: "+0987654321",
        owner: false,
        created: "2024-01-15T14:30:00.000Z",
        direction: "inbound"
      },
      {
        id: "msg_8",
        text: "I can show you a few options in that range. Are you available this weekend?",
        whatsappNumber: "+0987654321", 
        owner: true,
        created: "2024-01-15T14:35:00.000Z",
        direction: "outbound"
      }
    ]
  }
};

export function getMockWatiData() {
  // Simulate API delay
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve(mockWatiResponse);
    }, 1000);
  });
}