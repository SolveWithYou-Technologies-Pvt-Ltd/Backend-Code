const Service = require(
  "../models/serviceModel"
);

const ServiceCodeCounter = require(
  "../models/ServiceCodeCounter"
);

const COUNTER_ID = "service-code";

const getLargestExistingCode =
  async () => {
    const result =
      await Service.aggregate([
        {
          $match: {
            serviceCode: {
              $regex: /^\d+$/,
            },
          },
        },
        {
          $project: {
            numericCode: {
              $convert: {
                input:
                  "$serviceCode",
                to: "int",
                onError: 0,
                onNull: 0,
              },
            },
          },
        },
        {
          $sort: {
            numericCode: -1,
          },
        },
        {
          $limit: 1,
        },
      ]);

    return (
      result[0]?.numericCode ||
      0
    );
  };

const generateServiceCode =
  async () => {
    const largestCode =
      await getLargestExistingCode();

    await ServiceCodeCounter.findByIdAndUpdate(
      COUNTER_ID,
      {
        $max: {
          sequence: largestCode,
        },
      },
      {
        upsert: true,
        setDefaultsOnInsert: true,
      }
    );

    const counter =
      await ServiceCodeCounter.findByIdAndUpdate(
        COUNTER_ID,
        {
          $inc: {
            sequence: 1,
          },
        },
        {
          new: true,
          upsert: true,
        }
      );

    return String(
      counter.sequence
    );
  };

module.exports = {
  generateServiceCode,
};
