const fs = require("fs");

const readJsonFile = new Promise((resolve, reject) => {
  fs.readFile("1-input.json", "utf-8", (err, data) => {
    if (err) {
      console.error("Error reading file: ", err);
      reject("Error reading file: ", err);
    }
    try {
      const inputData = JSON.parse(data);
      //console.log(inputData);
      resolve(inputData);
    } catch (err) {
      console.error("Error parsing json: ", err);
      reject("Error parsing json: ", err);
    }
  });
});

function sortDataOnTime(data) {
  data.sort((d1, d2) => {
    if (d1.startDate > d2.startDate) {
      return 1;
    }
    return -1;
  });
  return data;
}

function acumulateMonthly(data) {
  let dataMonthly = [];
  let sum = data[0]?.amount || 0;
  for (let i = 1; i < data.length; i++) {
    if (data[i].startDate === data[i - 1].startDate) {
      sum += data[i].amount;
    } else {
      dataMonthly.push({
        amount: sum,
        startDate: data[i - 1].startDate,
      });
      sum = data[i].amount;
    }
  }
  if (data.length) {
    dataMonthly.push({
      amount: sum,
      startDate: data[data.length - 1].startDate,
    });
  }
  return dataMonthly;
}

function generateBalanceSheet() {
  readJsonFile.then((data) => {
    let revenue = data?.revenueData || [];
    let expenses = data?.expenseData || [];

    //console.log(revenue);
    revenue = sortDataOnTime(revenue);
    expenses = sortDataOnTime(expenses);
    //console.log(revenue);

    let revenueMonthly = acumulateMonthly(revenue);
    let expensesMonthly = acumulateMonthly(expenses);
    let balance = [];
    let left = 0;
    let right = 0;

    while (left < revenueMonthly.length || right < expensesMonthly.length) {
      const revenueDate =
        left < revenueMonthly.length ? revenueMonthly[left].startDate : null;
      const expensesDate =
        right < expensesMonthly.length
          ? expensesMonthly[right].startDate
          : null;

      if (revenueDate === expensesDate) {
        balance.push({
          amount: revenueMonthly[left].amount - expensesMonthly[right].amount,
          startDate: revenueMonthly[left].startDate,
        });
        left++;
        right++;
      } else if (revenueDate < expensesDate || expensesDate === null) {
        balance.push({
          amount: revenueMonthly[left].amount,
          startDate: revenueMonthly[left].startDate,
        });
        left++;
      } else if (revenueDate > expensesDate || revenueDate === null) {
        balance.push({
          amount: -expensesMonthly[right].amount,
          startDate: expensesMonthly[right].startDate,
        });
        right++;
      }
    }
    // while (left < revenueMonthly.length) {
    //   balance.push({
    //     amount: revenueMonthly[left].amount,
    //     startDate: revenueMonthly[left].startDate,
    //   });
    //   left++;
    // }
    // while (right < expensesMonthly.length) {
    //   balance.push({
    //     amount: -expensesMonthly[right].amount,
    //     startDate: expensesMonthly[right].startDate,
    //   });
    //   right++;
    // }
    const startMonth = balance.length > 0 ? balance[0].startDate : null;
    const endMonth =
      balance.length > 0 ? balance[balance.length - 1].startDate : null;

    if (startMonth && endMonth) {
      const currentDate = new Date(startMonth);
      const lastDate = new Date(endMonth);

      // Add missing months with zero amount to the balance
      while (currentDate <= lastDate) {
        const currentMonth =
          currentDate.toISOString().slice(0, 10) + "T00:00:00.000Z";
        const monthExists = balance.some(
          (entry) => entry.startDate === currentMonth
        );
        if (!monthExists) {
          balance.push({
            amount: 0,
            startDate: currentMonth,
          });
        }

        currentDate.setMonth(currentDate.getMonth() + 1);
      }

      const balanceSheet = {
        balance: balance,
      };

      console.log(balanceSheet);
      //console.log(JSON.stringify(balanceSheet));
    }
  });
}

generateBalanceSheet();
