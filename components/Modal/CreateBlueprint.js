import React from "react";
import { Modal } from "patternfly-react";
import { FormattedMessage } from "react-intl";
import PropTypes from "prop-types";
import { connect } from "react-redux";
import {
  setModalCreateBlueprintErrorInline,
  setModalCreateBlueprintCheckErrors,
  setModalCreateBlueprintBlueprint
} from "../../core/actions/modals";
import { creatingBlueprint } from "../../core/actions/blueprints";

class CreateBlueprint extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      showModal: false
    };
    this.open = this.open.bind(this);
    this.close = this.close.bind(this);
  }

  open() {
    this.setState({ showModal: true });
  }

  close() {
    this.setState({ showModal: false });
  }

  render() {
    return (
      <React.Fragment>
        <button
          className="btn btn-default"
          id="cmpsr-btn-crt-blueprint"
          type="button"
          onClick={this.open}
          disabled={this.props.disabled}
        >
          <FormattedMessage defaultMessage="Create Blueprint" />
        </button>
        {this.state.showModal && (
          <CreateBlueprintModal
            blueprintNames={this.props.blueprintNames}
            setModalCreateBlueprintErrorInline={this.props.setModalCreateBlueprintErrorInline}
            setModalCreateBlueprintCheckErrors={this.props.setModalCreateBlueprintCheckErrors}
            setModalCreateBlueprintBlueprint={this.props.setModalCreateBlueprintBlueprint}
            createBlueprint={this.props.createBlueprint}
            creatingBlueprint={this.props.creatingBlueprint}
            close={this.close}
          />
        )}
      </React.Fragment>
    );
  }
}

class CreateBlueprintModal extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      errorNameEmpty: false,
      errorNameDuplicate: false
    };
  }

  componentWillUnmount() {
    const initialBlueprint = {
      name: "",
      description: "",
      modules: [],
      packages: []
    };
    this.props.setModalCreateBlueprintBlueprint(initialBlueprint);
  }

  handleChange(e, prop) {
    const o = Object.assign({}, this.props.createBlueprint.blueprint);
    o[prop] = e.target.value;
    this.props.setModalCreateBlueprintBlueprint(o);
    if (prop === "name") {
      this.dismissErrors();
      this.handleErrorDuplicate(e.target.value);
    }
  }

  handleEnterKey(event) {
    if (event.which === 13 || event.keyCode === 13) {
      this.handleErrors(this.props.createBlueprint.blueprint.name);
      setTimeout(() => {
        if (this.state.errorNameEmpty || this.state.errorNameDuplicate) {
          this.showInlineError();
        } else {
          this.handleCreateBlueprint(this.props.createBlueprint.blueprint);
        }
      }, 300);
    }
  }

  handleCreateBlueprint(blueprint) {
    this.close();
    const updatedBlueprint = blueprint;
    updatedBlueprint.id = updatedBlueprint.name.replace(/\s/g, "-");
    this.props.creatingBlueprint(updatedBlueprint);
  }

  errorChecking(state) {
    this.props.setModalCreateBlueprintCheckErrors(state);
  }

  dismissErrors() {
    this.setState({ errorNameEmpty: false, errorNameDuplicate: false });
    this.props.setModalCreateBlueprintErrorInline(false);
  }

  handleErrors(blueprintName) {
    this.handleErrorDuplicate(blueprintName);
    this.handleErrorName(blueprintName);
  }

  handleErrorDuplicate(blueprintName) {
    const nameNoSpaces = blueprintName.replace(/\s+/g, "-");
    if (this.props.blueprintNames.includes(nameNoSpaces)) {
      this.setState({ errorNameDuplicate: true });
    }
  }

  handleErrorName(blueprintName) {
    if (blueprintName === "" && this.props.createBlueprint.checkErrors) {
      setTimeout(() => {
        this.setState({ errorNameEmpty: true });
      }, 200);
    }
  }

  showInlineError() {
    this.props.setModalCreateBlueprintErrorInline(true);
  }

  render() {
    const { createBlueprint } = this.props;
    return (
      <Modal show onHide={this.props.close} id="cmpsr-modal-crt-blueprint">
        <Modal.Header>
          <Modal.CloseButton
            onClick={() => {
              this.dismissErrors();
              this.props.close();
            }}
          />
          <Modal.Title>
            <FormattedMessage defaultMessage="Create Blueprint" />
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {createBlueprint.errorInline && this.state.errorNameEmpty && (
            <div className="alert alert-danger">
              <span className="pficon pficon-error-circle-o" />
              <strong>
                <FormattedMessage defaultMessage="Required information is missing." />
              </strong>
            </div>
          )}
          {createBlueprint.errorInline && this.state.errorNameDuplicate && (
            <div className="alert alert-danger">
              <span className="pficon pficon-error-circle-o" />
              <strong>
                <FormattedMessage defaultMessage="Specify a new blueprint name." />
              </strong>
            </div>
          )}
          <form className="form-horizontal">
            <p className="fields-status-pf">
              <FormattedMessage
                defaultMessage="The fields marked with {val} are required."
                values={{
                  val: <span className="required-pf">*</span>
                }}
              />
            </p>
            <div
              className={`form-group ${this.state.errorNameEmpty || this.state.errorNameDuplicate ? "has-error" : ""}`}
            >
              <label className="col-sm-3 control-label required-pf" htmlFor="textInput-modal-markup">
                <FormattedMessage defaultMessage="Name" />
              </label>
              <div className="col-sm-9">
                <input
                  autoFocus
                  type="text"
                  id="textInput-modal-markup"
                  className="form-control"
                  value={createBlueprint.blueprint.name}
                  onFocus={e => {
                    this.dismissErrors();
                    this.handleErrorDuplicate(e.target.value);
                  }}
                  onChange={e => this.handleChange(e, "name")}
                  onBlur={e => this.handleErrors(e.target.value)}
                  onKeyPress={e => this.handleEnterKey(e)}
                />
                {this.state.errorNameEmpty && (
                  <span className="help-block">
                    <FormattedMessage defaultMessage="A blueprint name is required." />
                  </span>
                )}
                {this.state.errorNameDuplicate && (
                  <span className="help-block">
                    <FormattedMessage
                      defaultMessage="The name {name} already exists."
                      values={{
                        name: createBlueprint.blueprint.name
                      }}
                    />
                  </span>
                )}
              </div>
            </div>
            <div className="form-group">
              <label className="col-sm-3 control-label" htmlFor="textInput2-modal-markup">
                <FormattedMessage defaultMessage="Description" />
              </label>
              <div className="col-sm-9">
                <input
                  type="text"
                  id="textInput2-modal-markup"
                  className="form-control"
                  value={createBlueprint.blueprint.description}
                  onChange={e => this.handleChange(e, "description")}
                  onKeyPress={e => this.handleEnterKey(e)}
                />
              </div>
            </div>
          </form>
        </Modal.Body>
        <Modal.Footer>
          <button
            type="button"
            className="btn btn-default"
            onMouseEnter={() => this.errorChecking(false)}
            onMouseLeave={() => this.errorChecking(true)}
            onClick={e => {
              this.props.close();
              this.dismissErrors(e);
            }}
          >
            <FormattedMessage defaultMessage="Cancel" />
          </button>
          {((createBlueprint.blueprint.name === "" || this.state.errorNameDuplicate) && (
            <button
              id="create-blueprint-modal-create-button"
              type="button"
              className="btn btn-primary"
              onClick={e => this.showInlineError(e)}
            >
              <FormattedMessage defaultMessage="Create" />
            </button>
          )) || (
            <button
              id="create-blueprint-modal-create-button"
              type="button"
              className="btn btn-primary"
              onClick={() => this.handleCreateBlueprint(createBlueprint.blueprint)}
            >
              <FormattedMessage defaultMessage="Create" />
            </button>
          )}
        </Modal.Footer>
      </Modal>
    );
  }
}

CreateBlueprintModal.propTypes = {
  close: PropTypes.func.isRequired,
  blueprintNames: PropTypes.arrayOf(PropTypes.string).isRequired,
  setModalCreateBlueprintErrorInline: PropTypes.func.isRequired,
  setModalCreateBlueprintCheckErrors: PropTypes.func.isRequired,
  setModalCreateBlueprintBlueprint: PropTypes.func.isRequired,
  createBlueprint: PropTypes.shape({
    blueprint: PropTypes.object,
    checkErrors: PropTypes.bool,
    errorInline: PropTypes.bool,
    inlineError: PropTypes.bool
  }).isRequired,
  creatingBlueprint: PropTypes.func.isRequired
};

CreateBlueprint.propTypes = {
  blueprintNames: PropTypes.arrayOf(PropTypes.string),
  disabled: PropTypes.bool,
  setModalCreateBlueprintErrorInline: PropTypes.func,
  setModalCreateBlueprintCheckErrors: PropTypes.func,
  setModalCreateBlueprintBlueprint: PropTypes.func,
  createBlueprint: PropTypes.shape({
    blueprint: PropTypes.object,
    checkErrors: PropTypes.bool,
    errorInline: PropTypes.bool,
    inlineError: PropTypes.bool
  }),
  creatingBlueprint: PropTypes.func
};

CreateBlueprint.defaultProps = {
  blueprintNames: [],
  disabled: false,
  setModalCreateBlueprintErrorInline: function() {},
  setModalCreateBlueprintCheckErrors: function() {},
  setModalCreateBlueprintBlueprint: function() {},
  createBlueprint: {},
  creatingBlueprint: function() {}
};

const mapStateToProps = state => ({
  createBlueprint: state.modals.createBlueprint
});

const mapDispatchToProps = dispatch => ({
  setModalCreateBlueprintErrorInline: inlineError => {
    dispatch(setModalCreateBlueprintErrorInline(inlineError));
  },
  setModalCreateBlueprintCheckErrors: checkErrors => {
    dispatch(setModalCreateBlueprintCheckErrors(checkErrors));
  },
  setModalCreateBlueprintBlueprint: blueprint => {
    dispatch(setModalCreateBlueprintBlueprint(blueprint));
  },
  creatingBlueprint: blueprint => {
    dispatch(creatingBlueprint(blueprint));
  }
});

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(CreateBlueprint);
