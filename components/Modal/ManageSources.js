/* eslint-disable no-unused-vars */
/* eslint-disable jsx-a11y/label-has-associated-control */
/* eslint-disable react/no-did-update-set-state */

import React from "react";
import PropTypes from "prop-types";
import { connect } from "react-redux";
import { FormattedMessage, defineMessages, injectIntl, intlShape } from "react-intl";
import { Alert, Spinner } from "patternfly-react";
import { Modal, ModalVariant, Title } from "@patternfly/react-core";
import SourcesListItem from "../ListView/SourcesListItem";
import EmptyState from "../EmptyState/EmptyState";
import {
  addModalManageSourcesEntry,
  removeModalManageSourcesEntry,
  modalManageSourcesFailure,
} from "../../core/actions/modals";

const messages = defineMessages({
  infotip: {
    defaultMessage:
      "Sources are used for resolving blueprint dependencies and for composing images. " +
      "When adding custom sources you must make sure that the packages in the source do not conflict with any other package sources, " +
      "otherwise resolving dependencies and composing images will fail.",
  },
  errorStateTitle: {
    defaultMessage: "An error occurred",
  },
  errorStateMessage: {
    defaultMessage: "An error occurred while trying to get sources.",
  },
  closeButtonLabel: {
    defaultMessage: "Close",
  },
  sourcePath: {
    defaultMessage: "Source path",
    description: "The path or url to the source repository",
  },
  name: {
    defaultMessage: "Name",
    description: "Name of source",
  },
  type: {
    defaultMessage: "Type",
    description: "Type of source",
  },
  security: {
    defaultMessage: "Security",
  },
  check_ssl: {
    defaultMessage: "Check SSL certificate",
  },
  check_gpg: {
    defaultMessage: "Check GPG key",
  },
  selectOne: {
    defaultMessage: "Select one",
  },
  typeRepo: {
    defaultMessage: "yum repository",
  },
  typeMirrorlist: {
    defaultMessage: "mirrorlist",
  },
  typeMetalink: {
    defaultMessage: "metalink",
  },
  add: {
    defaultMessage: "Add source",
  },
  save: {
    defaultMessage: "Add source",
  },
  update: {
    defaultMessage: "Update source",
  },
  cancel: {
    defaultMessage: "Cancel",
  },
});

class ManageSources extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      showModal: false,
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
      <>
        <a href="#" onClick={!this.props.disabled ? this.open : undefined}>
          <FormattedMessage
            defaultMessage="Manage sources"
            description="User action for displaying the list of source repositories"
          />
        </a>
        {this.state.showModal && (
          <ManageSourcesModal
            manageSources={this.props.manageSources}
            addSource={this.props.addModalManageSourcesEntry}
            removeSource={this.props.removeModalManageSourcesEntry}
            clearError={this.props.modalManageSourcesFailure}
            close={this.close}
            intl={this.props.intl}
          />
        )}
      </>
    );
  }
}

class ManageSourcesModal extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      addEntry: false,
      url: "",
      name: "",
      type: "",
      check_ssl: false,
      check_gpg: false,
      warningDuplicateName: false,
      warningDuplicateUrl: false,
      editName: "",
    };
    this.handleShowForm = this.handleShowForm.bind(this);
    this.handleChange = this.handleChange.bind(this);
    this.handleValidateName = this.handleValidateName.bind(this);
    this.handleValidateUrl = this.handleValidateUrl.bind(this);
    this.handleEditSource = this.handleEditSource.bind(this);
    this.handleSubmitSource = this.handleSubmitSource.bind(this);
  }

  componentDidUpdate(prevProps) {
    // if no errors are returned on add/edit, then reset form state after fetching sources completes
    if (
      Object.keys(this.props.manageSources.error).length === 0 &&
      !this.props.manageSources.fetchingSources &&
      prevProps.manageSources.fetchingSources
    ) {
      this.setState({
        addEntry: false,
        url: "",
        name: "",
        type: "",
        check_ssl: false,
        check_gpg: false,
      });
    }
  }

  handleShowForm(ev, showForm) {
    this.setState({ addEntry: showForm });
    if (showForm) {
      this.setState({
        editName: "",
      });
    } else {
      this.props.clearError({});
      this.setState({
        url: "",
        name: "",
        type: "",
        check_ssl: false,
        check_gpg: false,
        warningDuplicateName: false,
        warningDuplicateUrl: false,
      });
    }
    ev.preventDefault();
  }

  handleChange(ev, input) {
    let value;
    if (input === "check_ssl" || input === "check_gpg") {
      value = ev.target.checked;
    } else {
      value = ev.target.value.trim();
    }
    if (input === "name") {
      this.handleValidateName(value);
    }
    if (input === "url") {
      this.handleValidateUrl(value);
    }
    this.setState({ [input]: value });
    ev.preventDefault();
  }

  handleValidateName(name) {
    const duplicateName = this.props.manageSources.hasOwnProperty(name);
    this.setState({ warningDuplicateName: duplicateName });
  }

  handleValidateUrl(url) {
    const sourceUrls = Object.values(this.props.manageSources.sources).map((source) => source.url);
    this.setState({ warningDuplicateUrl: !sourceUrls.every((sourceUrl) => sourceUrl !== url) });
  }

  handleEditSource(name) {
    this.setState({
      addEntry: true,
      editName: name,
      name,
      type: this.props.manageSources.sources[name].type,
      url: this.props.manageSources.sources[name].url,
      check_ssl: this.props.manageSources.sources[name].check_ssl,
      check_gpg: this.props.manageSources.sources[name].check_gpg,
    });
  }

  handleSubmitSource(ev) {
    this.props.clearError({});
    const source = {
      name: this.state.name,
      url: this.state.url,
      type: this.state.type,
      check_ssl: this.state.check_ssl,
      check_gpg: this.state.check_gpg,
    };
    this.props.addSource(source);
    ev.preventDefault();
  }

  render() {
    const { formatMessage } = this.props.intl;
    const { manageSources } = this.props;
    const systemSources = Object.values(manageSources.sources).filter((source) => source.system === true);
    const customSources = Object.values(manageSources.sources).filter((source) => source.system !== true);
    const disabledSubmit =
      this.state.name === "" ||
      this.state.url === "" ||
      this.state.type === "" ||
      this.state.warningDuplicateName ||
      this.state.warningDuplicateUrl ||
      manageSources.fetchingSources;
    const manageSourcesForm = (
      <>
        {Object.keys(manageSources.error).length !== 0 && (
          <Alert>
            <FormattedMessage defaultMessage="An error occurred when saving the source. Check that the path is valid and try again." />
          </Alert>
        )}
        <form id="cmpsr-form-add-source" className="form-horizontal form-horizontal-pf-align-left">
          <p className="fields-status-pf">
            <FormattedMessage
              defaultMessage="The fields marked with {val} are required."
              values={{
                val: <span className="required-pf">*</span>,
              }}
            />
          </p>
          <div className={`form-group ${this.state.warningDuplicateName ? "has-error" : ""}`}>
            <label className="col-sm-2 control-label required-pf" htmlFor="textInput1-modal-source">
              {formatMessage(messages.name)}
            </label>
            <div className="col-sm-10">
              <input
                autoFocus
                type="text"
                id="textInput1-modal-source"
                className="form-control"
                aria-describedby="textInput1-modal-source-help"
                aria-required="true"
                aria-invalid={this.state.warningDuplicateName}
                readOnly={this.state.editName !== ""}
                value={this.state.name}
                onChange={(ev) => this.handleChange(ev, "name")}
              />
              {this.state.warningDuplicateName && (
                <span className="help-block" id="textInput1-modal-source-help">
                  <FormattedMessage defaultMessage="This source name already exists." />
                </span>
              )}
            </div>
          </div>
          <div className={`form-group ${this.state.warningDuplicateUrl ? "has-error" : ""}`}>
            <label className="col-sm-2 control-label required-pf" htmlFor="textInput2-modal-source">
              {formatMessage(messages.sourcePath)}
            </label>
            <div className="col-sm-10">
              <input
                type="text"
                id="textInput2-modal-source"
                className="form-control"
                aria-describedby="textInput2-modal-source-help"
                aria-required="true"
                aria-invalid={this.state.warningDuplicateUrl}
                value={this.state.url}
                onChange={(ev) => this.handleChange(ev, "url")}
              />
              {this.state.warningDuplicateUrl && (
                <span className="help-block" id="textInput2-modal-source-help">
                  <FormattedMessage defaultMessage="This source path already exists." />
                </span>
              )}
            </div>
          </div>
          <div className="form-group">
            <label className="col-sm-2 control-label required-pf" htmlFor="textInput3-modal-source">
              {formatMessage(messages.type)}
            </label>
            <div className="col-sm-10">
              <select
                id="textInput3-modal-source"
                className="form-control"
                value={this.state.type}
                aria-required="true"
                onChange={(ev) => this.handleChange(ev, "type")}
              >
                <option value="" disabled hidden>
                  {formatMessage(messages.selectOne)}
                </option>
                <option value="yum-baseurl">{formatMessage(messages.typeRepo)}</option>
                <option value="yum-mirrorlist">{formatMessage(messages.typeMirrorlist)}</option>
                <option value="yum-metalink">{formatMessage(messages.typeMetalink)}</option>
              </select>
            </div>
          </div>
          <div className="form-group">
            <label className="col-sm-2 control-label" id="checkboxGroup-modal-source">
              {formatMessage(messages.security)}
            </label>
            <fieldset className="col-sm-10 checkbox" aria-labelledby="checkboxGroup-modal-source">
              <div>
                <label htmlFor="checkboxInput4-modal-source">
                  <input
                    type="checkbox"
                    id="checkboxInput4-modal-source"
                    checked={this.state.check_ssl}
                    onChange={(ev) => this.handleChange(ev, "check_ssl")}
                  />
                  {formatMessage(messages.check_ssl)}
                </label>
              </div>
              <div>
                <label htmlFor="checkboxInput5-modal-source">
                  <input
                    type="checkbox"
                    id="checkboxInput5-modal-source"
                    checked={this.state.check_gpg}
                    onChange={(ev) => this.handleChange(ev, "check_gpg")}
                  />
                  {formatMessage(messages.check_gpg)}
                </label>
              </div>
            </fieldset>
          </div>
        </form>
      </>
    );

    const header = (
      <Title headingLevel="h2" size="3xl" id="title-manage-sources">
        {(!this.state.addEntry && (
          <FormattedMessage
            defaultMessage="Sources"
            description="Sources provide the contents from which components are selected"
          />
        )) ||
          (this.state.editName === "" && <FormattedMessage defaultMessage="Add source" />) || (
            <FormattedMessage defaultMessage="Edit source" />
          )}
      </Title>
    );

    const body = (
      <>
        {(Object.keys(manageSources.sources).length === 0 && (
          <EmptyState
            title={formatMessage(messages.errorStateTitle)}
            message={formatMessage(messages.errorStateMessage)}
          />
        )) || (
          <>
            {(!this.state.addEntry && (
              <>
                <div className="cmpsr-header cmpsr-header--modal">
                  <div className="cmpsr-header__actions">
                    <input
                      type="button"
                      autoFocus={this.state.editName === ""}
                      className="btn btn-primary pull-right"
                      onClick={(ev) => this.handleShowForm(ev, true)}
                      value={formatMessage(messages.add)}
                    />
                  </div>
                </div>
                <div className="list-pf cmpsr-list-pf list-pf-stacked cmpsr-list-sources">
                  {systemSources.map((source) => (
                    <SourcesListItem source={source} key={source.name} />
                  ))}
                  {customSources.length > 0 &&
                    customSources.map((source) => (
                      <SourcesListItem
                        source={source}
                        key={source.name}
                        edited={this.state.editName}
                        fetching={manageSources.fetchingSources}
                        edit={this.handleEditSource}
                        remove={this.props.removeSource}
                      />
                    ))}
                </div>
              </>
            )) ||
              manageSourcesForm}
          </>
        )}
      </>
    );

    const footer = (
      <>
        {(!this.state.addEntry && (
          <button type="button" className="btn btn-default" onClick={this.props.close}>
            <FormattedMessage defaultMessage="Close" />
          </button>
        )) || (
          <>
            {manageSources.fetchingSources && (
              <div className="pull-left">
                <Spinner loading size="xs" inline />
                <FormattedMessage defaultMessage="Saving source" />
              </div>
            )}
            <button type="button" className="btn btn-default" onClick={(ev) => this.handleShowForm(ev, false)}>
              {formatMessage(messages.cancel)}
            </button>
            <button
              type="submit"
              className="btn btn-primary"
              form="cmpsr-form-add-source"
              disabled={disabledSubmit}
              onClick={(ev) => this.handleSubmitSource(ev)}
            >
              {(this.state.editName === "" && formatMessage(messages.save)) || formatMessage(messages.update)}
            </button>
          </>
        )}
      </>
    );

    return (
      <Modal
        isOpen
        variant={ModalVariant.medium}
        id="cmpsr-modal-manage-sources"
        header={header}
        onClose={this.props.close}
        footer={footer}
        aria-labelledby="title-manage-sources"
      >
        {body}
      </Modal>
    );
  }
}

ManageSources.propTypes = {
  manageSources: PropTypes.shape({
    fetchingSources: PropTypes.bool,
    sources: PropTypes.objectOf(PropTypes.object),
    error: PropTypes.object,
  }),
  disabled: PropTypes.bool,
  removeModalManageSourcesEntry: PropTypes.func,
  addModalManageSourcesEntry: PropTypes.func,
  modalManageSourcesFailure: PropTypes.func,
  intl: intlShape.isRequired,
};

ManageSources.defaultProps = {
  manageSources: {},
  disabled: false,
  removeModalManageSourcesEntry() {},
  addModalManageSourcesEntry() {},
  modalManageSourcesFailure() {},
};

ManageSourcesModal.propTypes = {
  manageSources: PropTypes.shape({
    fetchingSources: PropTypes.bool,
    sources: PropTypes.objectOf(PropTypes.object),
    error: PropTypes.object,
  }),
  removeSource: PropTypes.func,
  addSource: PropTypes.func,
  clearError: PropTypes.func,
  close: PropTypes.func,
  intl: intlShape.isRequired,
};

ManageSourcesModal.defaultProps = {
  manageSources: {},
  removeSource() {},
  addSource() {},
  clearError() {},
  close() {},
};

const mapDispatchToProps = (dispatch) => ({
  addModalManageSourcesEntry: (source) => {
    dispatch(addModalManageSourcesEntry(source));
  },
  removeModalManageSourcesEntry: (sourceName) => {
    dispatch(removeModalManageSourcesEntry(sourceName));
  },
  modalManageSourcesFailure: (error) => {
    dispatch(modalManageSourcesFailure(error));
  },
});

export default connect(null, mapDispatchToProps)(injectIntl(ManageSources));
