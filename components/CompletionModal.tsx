import * as React from 'react'
import { Modal, Header, Button, Icon } from 'semantic-ui-react'

export interface CompletionModalProps {
  open: boolean
  username: string
}

export interface CompletionModalState {
  closed: boolean
}

class CompletionModal extends React.PureComponent<CompletionModalProps, CompletionModalState> {
  state = {
    closed: false
  }

  submitForUserStorage = async () => {
    this.setState({ closed: true })
    fetch('/api/save', { method: 'PUT' })
  }

  render() {
    return (
      <Modal open={this.props.open && !this.state.closed} size="small" basic>
        <Header icon="unlock" content="Authentication Complete" />
        <Modal.Content>
          {this.props.username}, you're now authenticated in the United Operations system! You will
          have access to use the Discord server, Teamspeak server, and the forums shortly. Be sure
          to contact a United Operations officer to have any non-transferred user groups manually
          reassigned to you on the respective platforms. Click the 'Finish' button and you can close
          this page.
        </Modal.Content>
        <Modal.Actions>
          <Button onClick={this.submitForUserStorage} color="green" basic inverted>
            <Icon name="check" />
            Finish
          </Button>
        </Modal.Actions>
      </Modal>
    )
  }
}

export default CompletionModal
