import styled from 'styled-components';


export const EditButton = styled.button.attrs({
	className: 'edit-button',
})`
  font-size: ${props => props.size}ems;
  cursor: pointer;

  &:hover {
    background: rgba(33, 150, 243, 0.3);
  }

  &:active {
    box-shadow: 0 0 0 3px rgba(33, 150, 243, 0.4);
    outline: none;
  }
	
`;