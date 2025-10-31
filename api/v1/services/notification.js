
import notification from "../../../models/notification";

const notificationService = {

    createNotification: async (obj) => {
        return await notification.create(obj);
    },

    findNotification: async (query) => {
        return await notification.findOne(query);
    },

    removeNotification: async (query) => {
        return await notification.findByIdAndDelete(query);
    },

    updateNotification: async (query, obj) => {
        return await notification.findByIdAndUpdate(query, obj, { new: true });
    },

    listNotification: async (query) => {
        return await notification.find(query).sort({ createdAt: -1 });
    },

    paginateNotification: async (query) => {
        let { userId, page, limit } = query;
        page = parseInt(page) + 1 || 1;
        const options = {
            page: page,
            limit: parseInt(limit) || 10,
            populate: [
                {
                    path: 'userId',
                    select: 'name profilePic'
                }
            ],
            sort: { createdAt: -1 }
        }
        return await notification.paginate({ toId: userId }, options)
    },

    insertManyNotification: async (arr) => {
        return await notification.insertMany(arr);
    }
}

export { notificationService };

