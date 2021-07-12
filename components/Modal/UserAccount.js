/* eslint-disable jsx-a11y/label-has-associated-control */

import React from "react";
import { FormattedMessage, defineMessages, injectIntl, intlShape } from "react-intl";
import PropTypes from "prop-types";
import { connect } from "react-redux";
import cockpit from "cockpit";
import Password from "../Form/Password";
import { setModalUserAccountData } from "../../core/actions/modals";

const messages = defineMessages({
  modalTitleCreate: {
    defaultMessage: "Create user account",
  },
  modalTitleEdit: {
    defaultMessage: "Edit user account",
  },
  sshKeyHelp: {
    defaultMessage: "Paste the contents of your public SSH key file here. ",
  },
  createPasswordOne: {
    defaultMessage: "Password",
  },
  createPasswordTwo: {
    defaultMessage: "Confirm password",
  },
  editPasswordOne: {
    defaultMessage: "New password",
  },
});

class UserAccount extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      currentUser: undefined,
      setNewPassword: false,
    };
    this.handleChange = this.handleChange.bind(this);
    this.handleHideModal = this.handleHideModal.bind(this);
    this.handleValidateUser = this.handleValidateUser.bind(this);
    this.handleSubmitUserAccount = this.handleSubmitUserAccount.bind(this);
    this.encryptPassword = this.encryptPassword.bind(this);
    this.setValidPassword = this.setValidPassword.bind(this);
    this.handleRemovePassword = this.handleRemovePassword.bind(this);
    this.makeUsername = this.makeUsername.bind(this);
    this.removeDiacritics = this.removeDiacritics.bind(this);
    this.isValidCharUsername = this.isValidCharUsername.bind(this);
  }

  componentDidMount() {
    $(this.modal).modal("show");
    $(this.modal).on("hidden.bs.modal", this.handleHideModal);
    if (this.props.userAccount.editUser !== "") {
      const currentUser = {
        ...this.props.users.find((user) => user.name === this.props.userAccount.name),
      };
      this.setState({ currentUser });
    }
  }

  handleRemovePassword() {
    this.props.setModalUserAccountData({ password: "" });
    this.setState((prevState) => {
      const updatedUser = { ...prevState.currentUser };
      delete updatedUser.password;
      return { currentUser: updatedUser };
    });
  }

  handleHideModal() {
    const data = {
      name: "",
      description: "",
      password: "",
      key: "",
      groups: [],
      showDuplicateUser: false,
      showInvalidName: false,
      dynamicName: true,
      visible: false,
      editUser: "",
      disabledSubmit: true,
    };
    this.props.setModalUserAccountData(data);
  }

  handleChange(e, prop) {
    let data = {};
    if (prop === "admin") {
      data = {
        groups: e.target.checked ? ["wheel"] : [""],
      };
    } else {
      data = { [prop]: e.target.value };
    }
    this.props.setModalUserAccountData(data);
    if (prop === "name") {
      this.props.setModalUserAccountData({ dynamicName: false });
      this.handleValidateUser(e.target.value);
    }
    if (prop === "description" && this.props.userAccount.dynamicName === true) {
      const userName = this.makeUsername(e.target.value);
      this.props.setModalUserAccountData({ name: userName });
      this.handleValidateUser(userName);
    }
  }

  handleValidateUser(name) {
    const userNames = this.props.users.map((user) => user.name);
    if (this.props.userAccount.editUser !== "") {
      userNames.filter((name) => name !== this.state.currentUser.name);
    }
    const showDuplicateUser = !userNames.every((userName) => userName.toLowerCase() !== name.toLowerCase());
    this.props.setModalUserAccountData({ showDuplicateUser });
    const validCharacters = name.length === 0 || /^(\d|\w|-|_|\.){0,252}$/.test(name);
    this.props.setModalUserAccountData({ showInvalidName: !validCharacters });
  }

  handleSubmitUserAccount(e) {
    // if creating a new user and password is defined, or editing a user and new password is defined,
    // then encrypt the password
    if (this.props.userAccount.password !== "") {
      this.encryptPassword(this.props.userAccount.password)
        .then((res) => this.props.handlePostUser(res))
        .catch((ex) => console.error("failed to encrypt password:", ex));
    } else {
      const password = this.state.currentUser ? this.state.currentUser.password : "";
      this.props.handlePostUser(password);
    }
    e.preventDefault();
    e.stopPropagation();
  }

  setValidPassword(password) {
    if (password === undefined) {
      this.props.setModalUserAccountData({ showInvalidPassword: true });
    } else {
      this.props.setModalUserAccountData({ password });
      this.props.setModalUserAccountData({ showInvalidPassword: false });
    }
  }

  makeUsername(realname) {
    let result = "";
    const name = realname.split(" ");
    if (name.length === 1) result = name[0].toLowerCase();
    else if (name.length > 1) result = name[0][0].toLowerCase() + name[name.length - 1].toLowerCase();
    return this.removeDiacritics(result);
  }

  removeDiacritics(str) {
    const translateTable = {
      a: "[àáâãäå]",
      ae: "æ",
      c: "[čç]",
      d: "ď",
      e: "[èéêë]",
      i: "[íìïî]",
      l: "[ĺľ]",
      n: "[ňñ]",
      o: "[òóôõö]",
      oe: "œ",
      r: "[ŕř]",
      s: "š",
      t: "ť",
      u: "[ùúůûűü]",
      y: "[ýÿ]",
      z: "ž",
    };
    for (const i in translateTable) str = str.replace(new RegExp(translateTable[i], "g"), i);
    for (let k = 0; k < str.length; ) {
      if (!this.isValidCharUsername(str[k])) str = str.substr(0, k) + str.substr(k + 1);
      else k += 1;
    }
    return str;
  }

  isValidCharUsername(c) {
    return (
      (c >= "a" && c <= "z") || (c >= "A" && c <= "Z") || (c >= "0" && c <= "9") || c === "." || c === "_" || c === "-"
    );
  }

  encryptPassword(password) {
    return cockpit
      .script(
        "$(which /usr/libexec/platform-python 2>/dev/null || which python3 2>/dev/null || which python) -c 'import sys, crypt; print(crypt.crypt(sys.stdin.readline().strip(), crypt.mksalt(crypt.METHOD_SHA512)))'",
        { err: "message" }
      )
      .input(password);
  }

  render() {
    const { userAccount } = this.props;
    const { formatMessage } = this.props.intl;
    const disabledSubmit =
      userAccount.showDuplicateUser ||
      userAccount.showInvalidName ||
      userAccount.name.length === 0 ||
      userAccount.showInvalidPassword;
    return (
      <div
        className="modal fade"
        id="cmpsr-modal-user-account"
        ref={(c) => {
          this.modal = c;
        }}
        tabIndex="-1"
        role="dialog"
        aria-labelledby="myModalLabel"
        aria-hidden="true"
      >
        <div className="modal-dialog">
          <form className="modal-content">
            <div className="modal-header">
              <button type="button" className="close" data-dismiss="modal">
                <span className="pficon pficon-close" />
              </button>
              <h4 className="modal-title" id="myModalLabel">
                {(userAccount.editUser !== "" && formatMessage(messages.modalTitleEdit)) ||
                  formatMessage(messages.modalTitleCreate)}
              </h4>
            </div>
            <div className="modal-body">
              <div className="form-horizontal">
                <p className="fields-status-pf">
                  <FormattedMessage
                    defaultMessage="The fields marked with {val} are required."
                    values={{
                      val: <span className="required-pf">*</span>,
                    }}
                  />
                </p>
                <div className="form-group">
                  <label className="col-sm-3 control-label" htmlFor="textInput2-modal-user">
                    <FormattedMessage defaultMessage="Full name" />
                  </label>
                  <div className="col-sm-9">
                    <input
                      type="text"
                      id="textInput2-modal-user"
                      className="form-control"
                      value={userAccount.description}
                      onChange={(e) => this.handleChange(e, "description")}
                    />
                  </div>
                </div>
                <div
                  className={`form-group ${
                    userAccount.showDuplicateUser || userAccount.showInvalidName ? "has-error" : ""
                  }`}
                >
                  <label className="col-sm-3 control-label required-pf" htmlFor="textInput1-modal-user">
                    <FormattedMessage defaultMessage="User name" />
                  </label>
                  <div className="col-sm-9">
                    <input
                      type="text"
                      id="textInput1-modal-user"
                      className="form-control"
                      aria-describedby="textInput1-modal-user-help1 textInput1-modal-user-help2"
                      value={userAccount.name}
                      onChange={(e) => this.handleChange(e, "name")}
                      aria-required="true"
                      aria-invalid={userAccount.showDuplicateUser || userAccount.showInvalidName}
                    />
                    {userAccount.showDuplicateUser && (
                      <span className="help-block" id="textInput1-modal-user-help1">
                        <FormattedMessage defaultMessage="This user name already exists." />
                      </span>
                    )}
                    {!userAccount.showDuplicateUser && (
                      <span className="help-block" id="textInput1-modal-user-help2">
                        <FormattedMessage defaultMessage="The user name can only consist of letters from a-z, digits, dots, dashes and underscores." />
                      </span>
                    )}
                  </div>
                </div>
                <div className="form-group">
                  <label className="col-sm-3 control-label">
                    <FormattedMessage defaultMessage="Role" />
                  </label>
                  <div className="col-sm-9 checkbox">
                    <label>
                      <input
                        type="checkbox"
                        aria-label="Server admin checkbox"
                        checked={userAccount.groups.includes("wheel")}
                        onChange={(e) => this.handleChange(e, "admin")}
                      />
                      <FormattedMessage defaultMessage="Server administrator" />
                    </label>
                  </div>
                </div>
                {((userAccount.editUser === "" ||
                  (userAccount.editUser !== "" &&
                    this.state.setNewPassword === true &&
                    this.state.currentUser !== undefined &&
                    this.state.currentUser.password === undefined)) && (
                  <Password
                    setValidPassword={this.setValidPassword}
                    labelOne={formatMessage(messages.createPasswordOne)}
                    labelTwo={formatMessage(messages.createPasswordTwo)}
                  />
                )) ||
                  (this.state.currentUser !== undefined && this.state.currentUser.password === undefined && (
                    <div className="form-group">
                      <label className="col-sm-3 control-label">
                        <FormattedMessage defaultMessage="Password" />
                      </label>
                      <div className="col-sm-9">
                        <p className="form-control-static">
                          <FormattedMessage defaultMessage="A password is not defined for this account." />
                        </p>
                        <button
                          type="button"
                          className="btn btn-default"
                          onClick={() => this.setState({ setNewPassword: true })}
                        >
                          <FormattedMessage defaultMessage="Set password" />
                        </button>
                      </div>
                    </div>
                  )) || (
                    <div>
                      <div className="form-group">
                        <label className="col-sm-3 control-label">
                          <FormattedMessage defaultMessage="Password" />
                        </label>
                        <div className="col-sm-9">
                          <p className="form-control-static">
                            <FormattedMessage defaultMessage="A password is defined for this account." />
                          </p>
                          {this.state.setNewPassword === false && (
                            <div>
                              <button
                                type="button"
                                className="btn btn-default"
                                onClick={() => this.setState({ setNewPassword: true })}
                              >
                                <FormattedMessage defaultMessage="Set new password" />
                              </button>

                              <button
                                type="button"
                                className="btn btn-default"
                                onClick={() => this.handleRemovePassword()}
                              >
                                <FormattedMessage defaultMessage="Remove password" />
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                      {this.state.setNewPassword === true && (
                        <Password
                          setValidPassword={this.setValidPassword}
                          labelOne={formatMessage(messages.editPasswordOne)}
                          labelTwo={formatMessage(messages.createPasswordTwo)}
                        />
                      )}
                    </div>
                  )}
                <div className="form-group">
                  <label className="col-sm-3 control-label" htmlFor="textInput5-modal-user">
                    <FormattedMessage defaultMessage="SSH key" />
                  </label>
                  <div className="col-sm-9">
                    <textarea
                      type="text"
                      id="textInput5-modal-user"
                      className="form-control"
                      aria-describedby="textInput5-modal-user-help"
                      rows="8"
                      value={userAccount.key}
                      onChange={(e) => this.handleChange(e, "key")}
                    />
                    <span className="help-block" id="textInput5-modal-user-help">
                      {formatMessage(messages.sshKeyHelp)}
                    </span>
                  </div>
                </div>
              </div>
            </div>
            <div className="modal-footer">
              <button type="button" className="btn btn-default" data-dismiss="modal">
                <FormattedMessage defaultMessage="Cancel" />
              </button>
              <button
                type="submit"
                className="btn btn-primary"
                disabled={disabledSubmit}
                onClick={(e) => this.handleSubmitUserAccount(e)}
              >
                {(userAccount.editUser !== "" && <FormattedMessage defaultMessage="Update" />) || (
                  <FormattedMessage defaultMessage="Create" />
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    );
  }
}

UserAccount.propTypes = {
  userAccount: PropTypes.shape({
    name: PropTypes.string,
    description: PropTypes.string,
    password: PropTypes.string,
    groups: PropTypes.arrayOf(PropTypes.string),
    key: PropTypes.string,
    showDuplicateUser: PropTypes.bool,
    showInvalidName: PropTypes.bool,
    showInvalidPassword: PropTypes.bool,
    dynamicName: PropTypes.bool,
    disabledSubmit: PropTypes.bool,
    visible: PropTypes.bool,
    editUser: PropTypes.string,
  }),
  users: PropTypes.arrayOf(PropTypes.object),
  setModalUserAccountData: PropTypes.func,
  handlePostUser: PropTypes.func,
  intl: intlShape.isRequired,
};

UserAccount.defaultProps = {
  userAccount: {},
  users: [],
  setModalUserAccountData() {},
  handlePostUser() {},
};

const mapStateToProps = (state) => ({
  userAccount: state.modals.userAccount,
});

const mapDispatchToProps = (dispatch) => ({
  setModalUserAccountData: (data) => {
    dispatch(setModalUserAccountData(data));
  },
});

export default connect(mapStateToProps, mapDispatchToProps)(injectIntl(UserAccount));
