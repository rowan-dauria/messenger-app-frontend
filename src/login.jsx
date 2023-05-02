import React from 'react';
import PropTypes from 'prop-types';

export default function Login({ loginCallback }) {
  const [email, setEmail] = React.useState(null);
  const [password, setPassword] = React.useState(null);

  const onClickLogin = () => {
    if (!email || !password) return;
    loginCallback(email, password);
  };

  return (
    <div className="Login">
      <input type="text" className="email" placeholder="email" onChange={(e) => setEmail(e.target.value)} />
      <input type="text" className="password" placeholder="password" onChange={(e) => setPassword(e.target.value)} />
      <button type="button" onClick={onClickLogin}>Login</button>
    </div>
  );
}

Login.propTypes = {
  loginCallback: PropTypes.func.isRequired,
};
