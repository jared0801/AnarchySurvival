export class SignIn {
    constructor(s) {
        this.socket = s;
        this.signDiv = document.getElementById('signDiv');
        this.signDivUsername = document.getElementById('signDiv-username');
        this.signDivPassword = document.getElementById('signDiv-password');
        this.signDivSignIn = document.getElementById('signDiv-signIn');
        this.headerDiv = document.getElementById('headerDiv');

        this.signDivSignIn.onclick = this.signIn.bind(this);

        this.signDivPassword.onkeydown = this.signInOnEnter.bind(this);

        this.signDivUsername.onkeydown = this.signInOnEnter.bind(this);

        this.socket.on('signInResponse', (data) => {
            if(data.success) {
                signDiv.style.display = 'none';
                headerDiv.style.display = 'none';
                gameDiv.style.display = 'inline-block';
            } else {
                alert('Sign in unsuccessful');
            }
        });
    }
    signInOnEnter(e) {
        if(e.keyCode == 13) {
            this.signIn();
        }
    }
    signIn() {
        this.socket.emit('signIn', { username: this.signDivUsername.value, password: this.signDivPassword.value });
    }
}

export class SignUp {
    constructor(s) {
        this.socket = s;
        this.regDiv = document.getElementById('regDiv');
        this.regDivEmail = document.getElementById('regDiv-email');
        this.regDivUsername = document.getElementById('regDiv-username');
        this.regDivPassword = document.getElementById('regDiv-password');
        this.regDivConfPassword = document.getElementById('regDiv-confPassword');
        this.regDivGender = document.getElementById('regDiv-gender');
        this.regDivSignUp = document.getElementById('regDiv-signUp');

        this.regDivGender.onkeydown = this.signUpOnEnter.bind(this);

        this.regDivConfPassword.onkeydown = this.signUpOnEnter.bind(this);

        this.regDivSignUp.onclick = this.signUp.bind(this);

        this.regDivConfPassword.onkeydown = function(e) {
            if(e.keyCode == 13) {
                this.signUp();
            }
        }

        this.socket.on('signUpResponse', (data) => {
            if(data.success) {
                alert('Sign up successful');
                window.location.href = '/';
            } else {
                alert('Sign up unsuccessful');
            }
        });
    }
    signUpOnEnter(e) {
        if(e.keyCode == 13) {
            this.signUp();
        }
    }
    signUp() {
        let error = '';
        let email = this.regDivEmail.value;
        if(!email.includes("@")) {
            error += '<p>Email must be valid.</p>';
        }
    
        let username = this.regDivUsername.value;
        if(username.length < 3 || username.length > 32) {
            error += '<p>Username length must be between 3 and 32.</p>';
        }
    
        let password = this.regDivPassword.value;
        let passConf = this.regDivConfPassword.value;
        if(password !== passConf) {
            error += '<p>Passwords must match.</p>';
        }
        if(error.length === 0)
            this.socket.emit('signUp', { email: this.regDivEmail.value, username: this.regDivUsername.value, password: this.regDivPassword.value, gender: this.regDivGender.value });
        else
            document.getElementById('errorDiv').innerHTML = error;
    }
}