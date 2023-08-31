import { faStar } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import React from 'react';

const STARS = [4,3,2,1,0];

/**
 * Poor man's classNames knockoff
 * @param  {...string} classes 
 * @returns string
 */
const classNames = (...classes) => classes.filter(Boolean).join(' ');

/**
 * Star rating component
 * @param {{
 *  disabled: boolean;
 *  rating: number;
 *  onChange(newRating: number): void;
 * }} props 
 * @returns {React.ReactNode}
 */
export function CommentRating({disabled, rating, onChange}) {
  const handleChange = (n) => () => onChange(n);

  return (
    <div>
      <p className='rating-prompt text-right pt-2 float-right'>
        <span className='mr-2'>How helpful was this feedback?</span>
        {
          STARS.map(n => (
            <span
              key={n}
              className={classNames('d-inline star', rating >= n && 'active', disabled && 'locked')}
              onClick={disabled ? undefined : handleChange(n)}
            >
              <FontAwesomeIcon className='btn-icon' size="1x" icon={faStar}/>
            </span>
          ))
        }
      </p>
    </div>
  )
}