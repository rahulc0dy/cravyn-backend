export const handleNewMessage = async (data) => {
  try {
    // const newMessage = await prisma.message.create({
    //   data: {
    //     content: data.content,
    //     messageType: data.messageType, // Ensure this matches your enum in Prisma
    //     senderId: data.senderId,
    //     chatId: data.chatId,
    //   },
    // });

    console.log(data);
    return newMessage;
  } catch (error) {
    console.error("Error in handleNewMessage:", error);
    throw error;
  }
};
