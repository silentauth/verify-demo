'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    return Promise.all([
      queryInterface.addColumn(
        'Users',
        'vonage_verify_check_url',
        {
          type: Sequelize.STRING,
          allowNull: true,
        },
      ),      
      queryInterface.addColumn(
        'Users',
        'vonage_verify_status',
        {
          type: Sequelize.STRING,
          allowNull: true,
        },
      ),
    ]);

  },

  async down (queryInterface, Sequelize) {
    return Promise.all([
      queryInterface.removeColumn('Users', 'vonage_verify_check_url'),
      queryInterface.removeColumn('Users', 'vonage_verify_status'),
    ]);

  }
};
