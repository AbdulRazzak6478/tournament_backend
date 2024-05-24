const { StatusCodes } = require('http-status-codes');
const AppError = require('../utils/errors/app-error');

class CrudRepository{
 
    constructor(model)
    {
        this.model = model;
    }
    
    async create(data)
    {
        const response = this.model.create(data);
        return response;
    }
    async getAll()
    {
        const response = await this.model.find({});
        return response;
    }
    async get(id)
    {
        const response = this.model.findById(id);
        if(!response)
        {
            throw new AppError("Not able to found the resource",StatusCodes.NOT_FOUND)
        }
        return response;
    }

    async deleteOne(id)
    {
        const response = this.model.deleteOne(id);
        if(!response)
        {
            throw new AppError("Not able to found the resource",StatusCodes.NOT_FOUND)
        }
        return response;
    }
    async delete(id)
    {
        const response = this.model.findByIdAndDelete(id);
        if(!response)
        {
            throw new AppError("Not able to found the resource",StatusCodes.NOT_FOUND)
        }
        return response;
    }
    async update(id,data)
    {
        console.log('id,data : ',id,data);
        const response = this.model.findByIdAndUpdate(id, data, {new : true});
        // if(!response[0])
        // {
        //     throw new AppError('Not able to found the resource',StatusCodes.NOT_FOUND)
        // }
        return response;
    }
}
module.exports = CrudRepository;