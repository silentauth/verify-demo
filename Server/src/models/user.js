'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class User extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
    }
  }
  User.init({
    phone_number: DataTypes.STRING,
    country_code: DataTypes.STRING,
    parsed_phone_number: DataTypes.STRING,
    vonage_verify_request_id: DataTypes.INTEGER,
    vonage_verify_check_url: DataTypes.STRING,
    vonage_verify_status: DataTypes.STRING
  }, {
    sequelize,
    modelName: 'User',
  });
  return User;
};