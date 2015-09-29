var page = require('webpage').create(),
    system = require('system'),
    moment = require('./node_modules/moment/moment.js');

if (system.args.length < 3 || system.args.length > 5) {
    console.log('Usage: sbi.js <username> <password> <month_in_multiple_of_6>');
    console.log('Options: -v : Debug');
    phantom.exit(1);
}
else
{
    uname   = system.args[1];
    pass    = system.args[2];
    months  = system.args[3] || 12;
    period  = Math.ceil(months/6);

    var debug = false;

    if(system.args[4] == '-v')
    {
      debug = true;
    }

    var fillLoginInfo = function(username, password)
    {
      var ev = document.createEvent("MouseEvents");
      ev.initEvent("click", true, true);
      document.querySelector('.login_button').dispatchEvent(ev);
      document.querySelector('input[name=userName]').value = username;
      document.querySelector('input[name=password]').value = password;
      document.querySelector("input[title=Login]").dispatchEvent(ev);
    }

    var goToAccountStatement = function()
    {
      document.querySelector("a[href='accountstatement.htm']").click();
    }

    var checkIfLoggedIn = function()
    {
      if(document.querySelector("p.errormsg") != null)
      {
        return document.querySelector("p.errormsg").innerText;
      }

      return false;
    }

    var fillStatementInfo = function(incr)
    {
      document.querySelector('input[name=startdate]').value = moment().subtract(6*(incr+1), 'months').add(1, 'days').format('DD/MM/YYYY');
      document.querySelector('input[name=enddate]').value = moment().subtract(6*incr, 'months').format('DD/MM/YYYY');
      document.querySelector("input[name=Submit3]").click();
    }

    var printStatementData = function()
    {
      var list = document.querySelectorAll('td.accountsStatementGrid');
      var data = [], i;
      for (i = 0; i < list.length; i++) {
          data.push(list[i].innerText);
      }
      document.querySelector("a[href='accountstatement.htm']").click();

      return data;
    }
    var incr = 0;

    page.onLoadFinished = function()
    {
      if(debug)
      {
        console.log(page.url);
      }
    	switch(page.url)
      {
        case "https://retail.onlinesbi.com/retail/login.htm":
      		page.evaluate(fillLoginInfo, uname, pass);
      		return;
          break;
        case "https://retail.onlinesbi.com/retail/mypage.htm":
          page.evaluate(goToAccountStatement);
          return;
          break;
        case "https://retail.onlinesbi.com/retail/loginsubmit.htm":
          var checkError = page.evaluate(checkIfLoggedIn);
          if(checkError)
            console.log(checkError);
          else
            console.log('Error occurred. Please try again.');
          break;
        case "https://retail.onlinesbi.com/retail/errorpage.htm":
          console.log('Session expired. Please login again');
          break;
        case "https://retail.onlinesbi.com/retail/accountstatement.htm":
          if(incr < period)
          {
            page.injectJs('./node_modules/moment/moment.js');
            page.evaluate(fillStatementInfo, incr);
            return;
          }
          break;
        case "https://retail.onlinesbi.com/retail/statementbydate.htm":
          page.render('./screens/some' + incr + '.png');
          incr++;
          var result = page.evaluate(printStatementData);
          console.log(result);
          return;
          break;
    	}
    	console.log("completed");
    	phantom.exit();
    }

    page.open("https://retail.onlinesbi.com/retail/login.htm");
}
