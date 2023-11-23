
exports.handler = async (event: any) => {

  console.log("request:", JSON.stringify(event, undefined, 2));

  return {
    statusCode: 200,
    body: `This page has been viewed!`
  };

};
